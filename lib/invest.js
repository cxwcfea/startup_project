var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Contract = require('../models/Contract'),
    Order = require('../models/Order'),
    moment = require('moment'),
    async = require('async'),
    priorityQueue = require('priorityqueuejs'),
    log4js = require('log4js'),
    logger = log4js.getLogger('invest'),
    util = require('./util');

function saveBackInvestor(data, cb) {
    async.waterfall([
        function (callback) {
            data.investor.save(function(err) {
                callback(err);
            });
        },
        function (callback) {
            var orderData = {
                userID: data.investor._id,
                userMobile: data.investor.mobile,
                dealType: 11,
                amount: Number(data.pay.toFixed(2)),
                status: 1,
                profitRate: data.investor.invest.profitRate,
                description: '投资项目 ' + data.contract.applySerialID,
                applySerialID: data.contract.applySerialID,
                contractID: data.contract._id,
                userBalance: data.investor.finance.balance
            };
            Order.create(orderData, function(err, order) {
                if (!err && !order) {
                    err = 'saveBackInvestor can not create pay order for apply:' + data.contract.applySerialID;
                }
                callback(err, order);
            });
        },
        function (order, callback) {
            var orderData = {
                userID: order.userID,
                userMobile: order.userMobile,
                dealType: 16,
                amount: order.amount,
                status: 2,
                profitRate: data.investor.invest.profitRate,
                investProfit: data.pay * (data.investor.invest.profitRate / 100) / 365 * data.contract.period,
                description: '投资项目 ' + data.contract.applySerialID + ' 本金返还',
                applySerialID: data.contract.applySerialID,
                contractID: data.contract._id,
                approvedAt: Date.now()
            };
            Order.create(orderData, function(err, o) {
                if (!err && !o) {
                    err = 'saveBackInvestor can not create capital return order for apply:' + data.contract.applySerialID;
                }
                callback(err, order);
            });
        },
        function (order, callback) {
            util.sendInvestSuccessSMS(order.userMobile, order.amount, data.contract.amount, order.profitRate);
            callback(null);
        }
    ], function (err) {
        if (err) {
            logger.error(err.toString());
        }
        cb(err);
    });
}

function returnProfitForEachInvestor(data, callback) {
    async.waterfall([
        function(callback) {
            Order.findOne({$and:[{userID:data.investor.uid}, {dealType:16}, {contractID:data.contract._id}, {status:2}]}, function(err, order) {
                if (!err && !order) {
                   err = 'can not find the return capital order';
                }
                callback(err, order);
            });
        },
        function(returnOrder, callback) {
            var day1 = moment(data.contract.startTime).dayOfYear();
            var day2 = moment().dayOfYear();
            var period = day2 - day1;
            if (period < 0) {
                period = 0;
            }
            var profit = data.investor.amount * (data.investor.profitRate / 100) / 365 * period;
            if (period < data.contract.period) {
                returnOrder.otherInfo = '提前还款';
            } else {
                returnOrder.otherInfo = '结束';
            }
            returnOrder.investProfit = profit;
            returnOrder.duration = period;
            var orderData = {
                userID: data.investor.uid,
                userMobile: data.investor.mobile,
                dealType: 12,
                amount: profit,
                status: 2,
                profitRate: data.investor.profitRate,
                description: '投资项目 ' + data.contract.applySerialID + ' 收益',
                applySerialID: data.contract.applySerialID,
                duration: period,
                approvedAt: Date.now()
            };
            Order.create(orderData, function(err, profitOrder) {
                callback(err, profitOrder, returnOrder);
            });
        },
        function(profitOrder, returnOrder, callback) {
            User.findById(profitOrder.userID, function (err, user) {
                callback(err, user, profitOrder, returnOrder);
            });
        },
        function(user, profitOrder, returnOrder, callback) {
            returnOrder.approvedAt = Date.now();
            returnOrder.status = 1;
            user.invest.total_invest_days += returnOrder.duration;
            user.invest.availableAmount += returnOrder.amount;
            user.invest.occupiedAmount -= returnOrder.amount;
            user.invest.history_invest_profit += profitOrder.amount;
            returnOrder.save(function(err) {
                callback(err, user, profitOrder, returnOrder);
            });
        },
        function(user, profitOrder, returnOrder, callback) {
            profitOrder.approvedAt = Date.now();
            util.orderFinished(user, profitOrder, 1, function(err) {
                callback(err, user, profitOrder, returnOrder);
            });
        },
        function(user, profitOrder, returnOrder, callback) {
            util.sendReturnProfitSMS(user.mobile, data.investor.amount, profitOrder.amount + returnOrder.amount, data.investor.profitRate, moment(data.contract.startTime).format('M月DD日'), profitOrder.amount);
            callback(null, profitOrder.amount);
        }
    ], function(err, profit) {
        if (err) {
            logger.error('findOrderForEachInvestor error (investor:' + data.investor.mobile + ' apply:' + data.contract.applySerialID + ' contract:' + data.contract._id + ')' + err.toString());
            profit = 0;
        }
        callback(null, profit);
    });
}

module.exports.findInvestorForApply = function(apply, cb) {
    if (apply.isTrial) {
       return cb(null);
    }
    var queue = new priorityQueue(function(a, b) {  // a, b should be user instance
        if (a.invest.profitRate < b.invest.profitRate) {
            return 1;
        } else if (a.invest.profitRate > b.invest.profitRate) {
            return -1;
        } else if (a.invest.duration < b.invest.duration) {
            return 1;
        } else if (a.invest.duration > b.invest.duration) {
            return -1;
        } else {
            return a.invest.availableAmount - b.invest.availableAmount;
        }
    });
    var investorInvolved = [];
    async.waterfall([
        function(callback) {
            var data = {
                applySerialID: apply.serialID,
                userMobile: apply.userMobile,
                amount: apply.amount,
                deposit: apply.deposit,
                sellValue: apply.sellValue,
                startTime: util.getStartDayForInvest(),
                endTime: apply.endTime
            };
            data.period = moment(data.endTime).diff(moment(data.startTime), 'days') + 1;
            Contract.create(data, function(err, contract) {
                if (!err && !contract) {
                    err = 'findInvestorForApply error can not create contract for apply:' + apply.serialID;
                }
                callback(err, contract);
            });
        },
        function(contract, callback) {
            User.find({$and:[{'invest.enable':true}, {'invest.duration':{$gt:apply.period}}, {'invest.availableAmount':{$gte:100}}]}, function(err, investors) {
                callback(err, contract, investors);
            });
        },
        function(contract, investors, callback) {
            investors.forEach(function(elem) {
                queue.enq(elem);
            });
            callback(null, contract);
        },
        function(contract, callback) {
            var amount = Math.floor(apply.amount / 100) * 100;
            while (amount >= 100 && queue.size()) {
                var investor = queue.deq();
                var pay;
                if (investor.invest.availableAmount >= amount) {
                    investor.invest.availableAmount -= amount;
                    pay = amount;
                    amount = 0;
                } else {
                    amount -= investor.invest.availableAmount;
                    pay = investor.invest.availableAmount;
                    investor.invest.availableAmount = 0;
                }
                logger.info('for investor:' + investor.mobile + ' pay:' + pay);
                investor.invest.occupiedAmount += pay;
                investor.invest.history_invest_amount += pay;
                var obj = {
                    uid: investor._id,
                    mobile: investor.mobile,
                    name: investor.identity.name,
                    id: investor.identity.id,
                    amount: pay,
                    profitRate: investor.invest.profitRate
                };
                contract.investors.push(obj);
                investorInvolved.push({investor:investor, pay:pay, contract:contract});
            }
            if (contract.investors.length === 0) {
                logger.info('can not find any investor for apply:' + apply.serialID);
                contract.remove(function(err) {
                    if (err) {
                        logger.info('error when remove useless contract ' + err.toString());
                    }
                    callback(null, null);
                })
            } else {
                if (amount > 0) {
                    contract.platformAmount = amount;
                }
                async.map(investorInvolved, saveBackInvestor, function(err, results) {
                    callback(err, contract);
                });
            }
        },
        function(contract, callback) {
            if (contract) {
                contract.startAt = Date.now();
                contract.save(function(err) {
                    callback(err, contract);
                });
            } else {
                callback(null, null);
            }
        },
        function(contract, callback) {
            if (contract) {
                apply.contractID = contract._id;
                apply.save(function(err) {
                    callback(err);
                });
            } else {
                callback(null);
            }
        }
    ], function(err) {
        if (err) {
            logger.warn('findInvestorForApply error:' + err.toString());
        }
        cb(null);
    });
};

module.exports.returnProfitToInvestor = function(contract, cb) {
    var investors = contract.investors;
    var dataArray = investors.map(function(elem) {
        var obj = {};
        obj.investor = elem;
        obj.contract = contract;
        return obj;
    });
    async.waterfall([
        function(callback) {
            async.map(dataArray, returnProfitForEachInvestor, function(err, results) {
                var totalProfit = 0;
                results.forEach(function(value) {
                    totalProfit += value;
                });
                callback(err, totalProfit);
            });
        },
        function(totalProfit, callback) {
            contract.status = 2;
            contract.totalProfit = totalProfit;
            contract.closeAt = Date.now();
            contract.save(function(err) {
                callback(err, contract);
            });
        },
        function(contract, callback) {
            Apply.findOne({serialID:contract.applySerialID}, function(err, apply) {
                callback(err, apply);
            });
        },
        function(apply, callback) {
            apply.profitForInvest += contract.totalProfit;
            apply.save(function(err) {
                callback(err, apply);
            });
        },
        function(apply, callback) {
            var applyEndDay = moment(apply.endTime).dayOfYear();
            var contractEndDay = moment(contract.endTime).dayOfYear();
            if (contractEndDay < applyEndDay && apply.status === 2) {
                exports.findInvestorForApply(apply, function(err) {
                    callback(err);
                });
            } else {
                callback(null);
            }
        }
    ], function(err) {
        if (err) {
            logger.warn('returnProfitToInvestor error ' + err.toString());
        }
        cb(null);
    });
};
