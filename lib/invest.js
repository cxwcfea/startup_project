var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Investor = require('../models/Investor'),
    Contract = require('../models/Contract'),
    Order = require('../models/Order'),
    moment = require('moment'),
    async = require('async'),
    priorityQueue = require('priorityqueuejs'),
    util = require('./util');

function saveBackInvestor(data, callback) {
    data.investor.save(function(err) {
        if (err) {
            callback(err);
        } else {
            var orderData = {
                userID: data.investor.userID,
                userMobile: data.investor.userMobile,
                dealType: 11,
                amount: Number(data.pay.toFixed(2)),
                status: 1,
                profitRate: data.investor.profitRate,
                investProfit: data.pay * (data.investor.profitRate / 100) / 365 * data.contract.period,
                description: '投资项目 ' + data.contract.applySerialID,
                applySerialID: data.contract.applySerialID,
                contractID: data.contract._id
            };
            Order.create(orderData, function(err, order) {
                if (!err && !order) {
                    err = 'saveBackInvestor can not create pay order for apply:' + data.contract.applySerialID;
                }
                if (err) {
                    callback(err);
                } else {
                    User.update({mobile:order.userMobile}, {$inc: {'finance.history_invest_amount':order.amount}}, function(err, numberAffected, raw) {
                        util.sendInvestSuccessSMS(order.userMobile, order.amount, data.contract.amount, order.profitRate);
                        callback(err);
                    });
                }
            });
        }
    });
}

function returnProfitForEachInvestor(data, callback) {
    var investAmount;
    async.waterfall([
        function(callback) {
            Order.findOne({$and:[{userMobile:data.mobile}, {dealType:11}, {applySerialID:data.contract.applySerialID}]}, function(err, order) {
                callback(err, order);
            });
        },
        function(order, callback) {
            if (!order) {
                logger.debug('findOrderForEachInvestor error order not found');
                callback(null, null);
            } else {
                Investor.update({userMobile:data.mobile}, {$inc: {amount:order.amount}}, function (err, numberAffected, raw) {
                    callback(err, order);
                });
            }
        },
        function(order, callback) {
            if (order) {
                investAmount = order.amount;
                var day1 = moment(data.contract.startTime).dayOfYear();
                var day2 = moment().dayOfYear();
                var period = day2 - day1;
                if (period < 0) {
                    period = 0;
                }
                var profit = order.amount * (order.profitRate / 100) / 365 * period;
                if (profit < order.investProfit) {
                    order.investProfit = profit;
                    order.otherInfo = '提前还款';
                } else {
                    order.otherInfo = '结束';
                }
                order.status = 1;
                order.duration = period;
                order.approvedAt = Date.now();
                order.save(function(err) {
                    callback(err, order);
                });
            } else {
                callback(null, null);
            }
        },
        function(order, callback) {
            if (order) {
                var orderData = {
                    userID: order.userID,
                    userMobile: order.userMobile,
                    dealType: 12,
                    amount: Number(order.investProfit.toFixed(2)),
                    status: 2,
                    profitRate: order.profitRate,
                    description: '投资 ' + order.applySerialID + ' 收益',
                    applySerialID: order.applySerialID
                };
                Order.create(orderData, function(err, o) {
                    callback(err, o);
                });
            } else {
                callback(null, null);
            }
        },
        function(order, callback) {
            if (order) {
                User.findOne({mobile:order.userMobile}, function (err, user) {
                    callback(err, user, order);
                });
            } else {
                callback(null, null);
            }
        },
        function(user, order, callback) {
            if (user) {
                user.history_invest_profit = order.amount;
                util.orderFinished(user, order, 1, function(err) {
                    if (!err) {
                        util.sendReturnProfitSMS(user.mobile, investAmount, data.contract.amount, order.profitRate, moment(data.contract.startTime).format('MMDD'), order.amount);
                    }
                    callback(err);
                })
            } else {
                callback(null);
            }
        }
    ], function(err) {
        if (err) {
            logger.warn('findOrderForEachInvestor error ' + err.toString());
        }
        callback(null);
    });
}

module.exports.findInvestorForApply = function(apply, period, cb) {
    var queue = new priorityQueue(function(a, b) {
        if (a.profitRate < b.profitRate) {
            return 1;
        } else if (a.profitRate > b.profitRate) {
            return -1;
        } else if (a.duration < b.duration) {
            return 1;
        } else if (a.duration > b.duration) {
            return -1;
        } else {
            return a.amount - b.amount;
        }
    });
    var investorInvolved = [];
    async.waterfall([
        function(callback) {
            var data = {
                applySerialID: apply.serialID,
                userMobile: apply.userMobile,
                amount: apply.amount,
                period: period,
                deposit: apply.deposit,
                sellValue: apply.sellValue,
                startTime: apply.startTime,
                endTime: apply.endTime
            };
            Contract.create(data, function(err, contract) {
                if (!err && !contract) {
                    err = 'findInvestorForApply error can not create contract for apply:' + apply.serialID;
                }
                callback(err, contract);
            });
        },
        function(contract, callback) {
            Investor.find({$and:[{enable:true}, {duration:{$gt:apply.period}}, {amount:{$gt:100}}]}, function(err, investors) {
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
                if (investor.amount >= amount) {
                    investor.amount -= amount;
                    pay = amount;
                    amount = 0;
                } else {
                    amount -= investor.amount;
                    pay = investor.amount;
                    investor.amount = 0;
                }
                contract.investors.push(investor.userMobile);
                investorInvolved.push({investor:investor, pay:pay, contract:contract});
            }
            async.mapSeries(investorInvolved, saveBackInvestor, function(err, results) {
                callback(err, contract);
            });
        },
        function(contract, callback) {
            contract.save(function(err) {
                callback(err);
            });
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
        obj.mobile = elem;
        obj.contract = contract;
        return obj;
    });
    async.waterfall([
        function(callback) {
            async.mapSeries(dataArray, returnProfitForEachInvestor, function(err, results) {
                callback(err);
            });
        },
        function(callback) {
            contract.status = 2;
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
            var applyEndDay = moment(apply.endTime).dayOfYear();
            var contractEndDay = moment(contract.endTime).dayOfYear();
            if (contractEndDay < applyEndDay && apply.status === 2) {
                exports.findInvestorForApply(apply, applyEndDay - contractEndDay, function(err) {
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
