var schedule = require('node-schedule'),
    sms = require('./sms'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    Apply = require('../models/Apply'),
    User = require('../models/User'),
    Order = require('../models/Order'),
    DailyData = require('../models/DailyData'),
    Contract = require('../models/Contract'),
    PPJDailyData = require('../models/PPJDailyData'),
    OperationData = require('../models/OperationData'),
    PPJUserDaily = require('../models/PPJUserDaily'),
    log4js = require('log4js'),
    logger = log4js.getLogger('task'),
    needle = require('needle'),
    async = require('async'),
    config = require('../config/config')['production'],
    invest = require('./invest'),
    mockTrader = require('../controllers/mockTrader'),
    ctpTrader = require('../controllers/ctpTrader'),
    util = require('./util');

require('../config/redis')();

//module.exports.initHive = function(){
//    ctpTrader.initHive(2);
//};

module.exports.scheduleJob = function() {
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(1, 5)];
    rule.hour = 20;
    rule.minute = 40;
    schedule.scheduleJob(rule, function(){
        console.log('The answer to life, the universe, and everything!');
        util.sendEmail('cxwcfea@163.com', 'task test', 'test task which run at 18 everyday', function(err) {
        });
    });
};

function postponeUserApply(apply, callback) {
    if (!apply.autoPostpone || !apply.accountType || apply.accountType === 1) {
        var content = util.sendSMS_13(apply.userMobile, apply.amount, apply.account);
        //weixin.sendWeixinTemplateMsg(apply.userMobile, {t_id:5, content:content});
        callback(null, apply.account + ' send sms');
        return;
    }
    var url = config.pay_callback_domain + '/api/auto_postpone_apply';
    var options = {
        json: true,
        follow_max: 3 // follow up to three redirects
    };
    needle.post(url, {serial_id:apply.serialID}, options, function(err, resp, body) {
        var feedback = '';
        if (err) {
            logger.warn(err.toString());
            feedback = apply.account + ' send sms';
            var content = util.sendSMS_13(apply.userMobile, apply.amount, apply.account);
	    //weixin.sendWeixinTemplateMsg(apply.userMobile, {t_id:5, content:content});
        } else if (resp.statusCode != 200) {
            logger.warn(resp.body);
            feedback = apply.account + ' send sms';
            var content = util.sendSMS_13(apply.userMobile, apply.amount, apply.account);
	    //weixin.sendWeixinTemplateMsg(apply.userMobile, {t_id:5, content:content});
        } else {
            feedback = apply.account + ' auto postpone success';
            logger.info('scheduleAutoPostponeJob success postpone for apply:' + apply.serialID);
        }
        callback(null, feedback);
    });
}

module.exports.scheduleAutoPostponeJob = function() {
    logger.info('scheduleAutoPostponeJob start schedule job');
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(1, 5)];
    rule.hour = 17;
    rule.minute = 00;
    schedule.scheduleJob(rule, function(){
        logger.info('scheduleAutoPostponeJob run');

        var startTime = moment();
        var isHoliday = util.isHoliday(startTime.dayOfYear());
        if (isHoliday) {
            logger.info('scheduleAutoPostponeJob today is holiday do nothing');
            return;
        }

        var options = {};
        mongoose.connect(config.db, options);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error...'));
        db.once('open', function callback() {
            console.log('goldenbull db opened for scheduleAutoPostponeJob');

            var endTime = util.getEndDay(startTime, 2);
            endTime.hour(15);
            endTime.minute(10);
            endTime.second(00);

            startTime.hour(15);
            startTime.minute(00);
            startTime.second(00);

            Apply.find({ $and: [{ endTime: {$lte: endTime } }, { endTime: {$gte: startTime } }, {status: 2}] }, function(err, applies) {
                logger.info('scheduleAutoPostponeJob run ' + applies.length);
                if (err) {
                    logger.warn('scheduleAutoPostponeJob error:' + err.toString());
                } else if (!applies) {
                    logger.warn('scheduleAutoPostponeJob error applies not found');
                } else {
                    async.mapSeries(applies, postponeUserApply, function(err, result) {
                        db.close();
                        logger.debug('done');
                        var content = '成功对以下账户自动延期:' + result.join(',');
                        util.sendEmail('op@niujinwang.com', '自动延期通知', content, function(err) {
                            if (err) {
                                logger.warn('scheduleAutoPostponeJob email send fail');
                            }
                        });
                        db.close();
                    });
                }
            });
        });

    });
};

module.exports.scheduleDailyDataJob = function() {
    logger.info('scheduleDailyDataJob start schedule job');
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(0, 6)];
    rule.hour = 23;
    rule.minute = 50;
    schedule.scheduleJob(rule, function() {
        logger.info('scheduleDailyDataJob run');

        var today = moment().startOf('day');
        async.waterfall([
            function(callback) {
                var Capital = 20000000;
                var query = User.find({});
                query.exists('wechat.wechat_uuid');
                query.populate('wechat.trader');
                query.exec(function(err, users) {
                    if (err) {
                        return callback(err);
                    }
                    var userCount = users.length;
                    var newUserCount = 0;
                    var winUserCount = 0;
                    var canAppointmentUserCount = 0;
                    var appointmentUserCount = 0;
                    var todayAppointmentCount = 0;
                    var totalProfit = 0;
                    for (var i = 0; i < users.length; ++i) {
                        if (users[i].registerAt > today) {
                            ++newUserCount;
                        }
                        var profit = (users[i].wechat.trader.lastCash - Capital) / 100;
                        if (profit > 0) {
                            ++winUserCount;
                            totalProfit += profit;
                            if (profit > 3000) {
                                ++canAppointmentUserCount;
                            }
                        }
                        if (users[i].wechat.appointment) {
                            ++appointmentUserCount;
                            if (users[i].wechat.appointmentAt > today) {
                                ++todayAppointmentCount;
                            }
                        }
                    }
                    var aveProfit = totalProfit / userCount;

                    var obj = {
                        userCount: userCount,
                        newUserCount: newUserCount,
                        winUserCount: winUserCount,
                        canAppointmentUserCount: canAppointmentUserCount,
                        appointmentUserCount: appointmentUserCount,
                        todayAppointmentCount: todayAppointmentCount,
                        totalProfit: totalProfit.toFixed(2),
                        aveProfit: aveProfit.toFixed(2)
                    };
                    callback(null, obj);
                });
            },
            function(data, callback) {
                mockTrader.Order.count({timestamp:{$gte:today}}, function (err, count) {
                    if (err) {
                        return callback(err);
                    }
                    data.totalHands = count;
                    callback(null, data);
                });
            }
        ], function (err, data) {
            if (err) {
                logger.warn('scheduleDailyDataJob error:' + err.toString());
            } else {
                var ppjData = new PPJDailyData(data);
                ppjData.save(function(err) {
                    if (err) {
                        logger.warn('scheduleDailyDataJob error:' + err.toString());
                    } else {
                        logger.info('scheduleDailyDataJob done');
                    }
                });
            }
        });
    });
};

function checkContract(contract, callback) {
    var today = moment().dayOfYear();
    var endDay = moment(contract.endTime).dayOfYear();
    if (endDay == today) {
        invest.returnProfitToInvestor(contract, function(err) {
            if (err) {
                logger.info('checkContract error ' + err.toString());
            }
            callback(null);
        });
    } else {
        callback(null);
    }
}

module.exports.scheduleContractCheckJob = function() {
    logger.info('scheduleContractCheckJob start schedule job');
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(0, 6)];
    rule.hour = 20;
    rule.minute = 00;
    schedule.scheduleJob(rule, function() {
        logger.info('scheduleContractCheckJob run');

        var options = {};
        mongoose.connect(config.db, options);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error...'));
        db.once('open', function callback() {
            console.log('goldenbull db opened for scheduleContractCheckJob');
            Contract.find({status:1}, function(err, contracts) {
                async.mapSeries(contracts, checkContract, function(err, results) {
                    if (err) {
                        logger.warn('scheduleContractCheckJob error:' + err.toString());
                    } else {
                        logger.info('scheduleContractCheckJob done');
                    }
                    db.close();
                });
            });
        });
    });
};

function collectOperationData(cb) {
    var data = {
        balance: 0,
        deposit: 0,
        availableInvest: 0,
        occupiedInvest: 0,
        serviceFeeNotGet: 0,
        rechargeToInvest: 0,
        investToBalance: 0,
        investProfit: 0,
        recharge: 0,
        withdraw: 0,
        commission: 0,
        commissionToBalace: 0,
        platformInvest: 0,
        freezeWithdraw: 0
    };
    async.waterfall([
        function (callback) {
            User.find({registered:true}, function(err, users) {
                callback(err, users);
            });
        },
        function (users, callback) {
            for (var i = 0; i < users.length; ++i) {
                data.balance += users[i].finance.balance;
                data.availableInvest += users[i].invest.availableAmount;
                data.occupiedInvest += users[i].invest.occupiedAmount;
            }
            callback(null);
        },
        function (callback) {
            Apply.find({$or:[{status:2}, {status:5}]}, function(err, applies) {
                callback(err, applies);
            });
        },
        function (applies, callback) {
            for (var i = 0; i < applies.length; ++i) {
                data.deposit += applies[i].deposit;
                if (applies[i].type === 2) {
                    continue;
                }
                var prePaidFee = util.getServiceFee(applies[i]);
                var tradeDays = util.tradeDaysTillNow(applies[i].startTime);
                var paidFee = util.getServiceFee(applies[i], tradeDays);
                data.serviceFeeNotGet += (prePaidFee - paidFee);
            }
            callback(null);
        },
        function (callback) {
            var endTime = moment().startOf('day');
            var startTime = endTime.clone().subtract(1, 'days');
            Order.find({$and:[{createdAt:{$gte:startTime.toDate()}}, {createdAt:{$lt:endTime.toDate()}}]}, function(err, orders) {
                callback(err, orders);
            });
        },
        function (orders, callback) {
                for (var i = 0; i < orders.length; ++i) {
                    if (orders[i].status == 1) {
                        if (orders[i].dealType === 17) {
                            data.rechargeToInvest += orders[i].amount;
                        } else if (orders[i].dealType === 18) {
                            data.investToBalance += orders[i].amount;
                        } else if (orders[i].dealType === 12) {
                            data.investProfit += orders[i].amount;
                        } else if (orders[i].dealType === 1) {
                            data.recharge += orders[i].amount;
                        } else if (orders[i].dealType === 2) {
                            data.withdraw += orders[i].amount;
                        } else if (orders[i].dealType === 13) {
                            data.commission += orders[i].amount;
                        } else if (orders[i].dealType === 14) {
                            data.commissionToBalace += orders[i].amount;
                        }
                    } else if (orders[i].dealType === 2 && (orders[i].status == 0 || orders[i].status == 2)) {
                        data.freezeWithdraw += orders[i].amount;
                    }
                }
            callback(null);
        },
        function (callback) {
            Contract.find({status:1}, function(err, contracts) {
                callback(err, contracts);
            });
        },
        function (contracts, callback) {
            contracts.forEach(function(elem) {
                data.platformInvest += elem.platformAmount;
            });
            callback(null);
        },
        function (callback) {
            var operationData = new OperationData(data);
            operationData.save(function (err) {
                callback(err);
            });
        }
    ], function (err) {
        if (err) {
            console.log('err when collectOperationData ' + err.toString());
        }
        console.log('collectOperationData done');
        cb(null);
    });
}

module.exports.scheduleOperationDataCollectJob = function() {
    logger.info('scheduleOperationDataCollectJob start schedule job');
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(0, 6)];
    rule.hour = 00;
    rule.minute = 01;
    schedule.scheduleJob(rule, function() {
        logger.info('scheduleOperationDataCollectJob run');

        var options = {};
        mongoose.connect(config.db, options);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error...'));
        db.once('open', function callback() {
            console.log('goldenbull db opened for scheduleOperationDataCollectJob');
            collectOperationData(function (err) {
                db.close();
            });
        });
    });
};

module.exports.scheduleFuturesRiskControlJob = function() {
    logger.info('scheduleFuturesRiskControlJob start schedule job');

    schedule.scheduleJob('*/30 * * * * *', function() {
        mockTrader.User.find({}, function (err, users) {
            if (err) {
                logger.warn('scheduleFuturesRiskControlJob error:' + err.toString());
                return;
            }
            async.each(users, function (user, callback) {
				if(user.real == true){
					ctpTrader.windControl(user._id, 0, {exchange:'future', stock_code:'IFCURR'}, function (err) {
						if (err) {
							logger.warn('scheduleFuturesRiskControlJob error:' + err.toString());
						}
						callback(null);
					});
				}else{
					mockTrader.windControl(user._id, 0, {exchange:'future', stock_code:'IFCURR'}, function (err) {
						if (err) {
							logger.warn('scheduleFuturesRiskControlJob error:' + err.toString());
						}
						callback(null);
					});
				}
			}, function(err){
            });
        });
    });
};

module.exports.scheduleTriggeredJob = function() {
	logger.info('scheduleTriggeredJob start schedule job');
	var userContract = {exchange:'future', stock_code:'IFCURR'};
    schedule.scheduleJob('*/2 * * * * *', function() {
        if (!global.redis_client) {
            console.log('cannot find redis_client');
            return;
        }
        global.redis_client.get(ctpTrader.makeRedisKey(userContract), function(err, priceInfoString) {
            if (err) {
                logger.warn('scheduleTriggeredJob error:' + err.toString());
                return callback(null);
            }
            var priceInfo = JSON.parse(priceInfoString);
            var currentPrice = priceInfo.LastPrice;
            //console.log('current price: ' + currentPrice);
            /*
            var user_with_trigger = ctpTrader.func.getPrivateStatic();
            if(typeof user_with_trigger === 'undefined'){
                console.log('wait...');
                return;
            }
            */
            mockTrader.User.find({tradeControl: true}, function(err, users){
                if(err){
                    console.log('get user from db failed in loadDBData');
                    return;
                }
                var user_with_trigger = users.map(function(user) {
                    return {
                        id: user._id,
                        real: user.real,
                        winPoint: user.winPoint,
                        lossPoint: user.lossPoint
                    };
                });
                    //console.log(user_with_trigger);
                async.each(user_with_trigger, function(user, callback){
                    //console.log('in async.');
                    mockTrader.Portfolio.find({userId: user.id}, function(err, portfolio) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        if (!portfolio) {
                            console.log('no available portfolio');
                            return;
                        }
                        for (var p in portfolio) {
                            var portf = portfolio[p];
                            mockTrader.Contract.findOne({_id: portf.contractId}, function(err, contract) {
                                if (err || !contract) {
                                    console.log(err);
                                    console.log(contract);
                                    console.log(portf);
                                    return;
                                }
                                //////////////////////////////
                                if (!(contract.exchange === userContract.exchange &&
                                    contract.stock_code === userContract.stock_code)) {
                                    return;
                                }
                                if(portf.quantity == 0 || portf.total_point == 0){
                                  return;
                                }
                                var buy_price = portf.total_point/100;
                                if(portf.quantity > 0){
                                    var trigger_in_price = buy_price + parseFloat(user.winPoint)/300 + 1;
                                    var trigger_out_price = buy_price - parseFloat(user.lossPoint)/300 + 1;
                                    if (currentPrice >= trigger_in_price || currentPrice <= trigger_out_price) {
                                        console.log('triggerrrrrrrrrrrrrrrrrrr');
                                        if(user.real){
                                            ctpTrader.windControl(user.id, 1, contract, function(err){
                                                if(err){
                                                    logger.warn('scheduleTriggeredJob error:' + err.toString());
                                                }
                                                callback(null);
                                            });
                                        }else{
                                            mockTrader.windControl(user.id, 1, contract, function(err){
                                                if(err){
                                                    logger.warn('scheduleTriggeredJob error:' + err.toString());
                                                }
                                                callback(null);
                                            });
                                        }
                                    }
                                }else{
                                    var trigger_in_price = buy_price - parseFloat(user.winPoint)/300 - 1;
                                    var trigger_out_price = buy_price + parseFloat(user.lossPoint)/300 - 1;
                                    if (currentPrice <= trigger_in_price || currentPrice >= trigger_out_price) {
                                        console.log('triggerrrrrrrrrrrrrrrrrrr');
                                        if(user.real){
                                            ctpTrader.windControl(user.id, 1, contract, function(err){
                                                if(err){
                                                    logger.warn('scheduleTriggeredJob error:' + err.toString());
                                                }
                                                callback(null);
                                            });
                                        }else{
                                            mockTrader.windControl(user.id, 1, contract, function(err){
                                                if(err){
                                                    logger.warn('scheduleTriggeredJob error:' + err.toString());
                                                }
                                                callback(null);
                                            });
                                        }
                                    }
                                }
                            ///////////////
                            });
                        }
                    });

                }, function(err) {

                });
            });
        });
    });
};

module.exports.scheduleFuturesForceCloseJob = function() {
    logger.info('scheduleFuturesForceCloseJob start schedule job');

    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(1, 5)];
    rule.hour = 15;
    rule.minute = 12;
    schedule.scheduleJob(rule, function() {
        logger.info('scheduleFuturesForceCloseJob run');

        mockTrader.User.find({}, function (err, users) {
            if (err) {
                logger.warn('scheduleFuturesForceCloseJob error:' + err.toString());
                return;
            }
            if(users.length == 0){
                console.log('no available user.');
                return;
            }
            var contract = {exchange:'future', stock_code:'IFCURR'};
            async.each(users, function(user, callback) {
                if (user.real == false){
                    mockTrader.windControl(user._id, 1, contract, function (err) {
                        if (err) {
                            logger.warn('scheduleFuturesForceCloseJob error:' + err.toString());
                        }
                        callback(null);
                    });
                } else {
                    ctpTrader.windControl(user._id, 1, contract, function (err) {
                        if (err) {
                            logger.warn('scheduleFuturesForceCloseJob error:' + err.toString());
                        }
                        callback(null);
                    });
                }
            }, function(err) {
                logger.info('scheduleFuturesForceCloseJob done');
            });
        });
    });
};

module.exports.scheduleHiveControlJob = function() {
    logger.info('scheduleHiveControlJob start schedule job');
    schedule.scheduleJob('36 14 9 * * *', function(){
        ctpTrader.initHive(1);
    });
    schedule.scheduleJob('1 15 15 * * *', function(){
        ctpTrader.destroyHive();
    });
};

module.exports.scheduleResetWechatUserJob = function() {
    logger.info('scheduleResetWechatUserJob start schedule job');

    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(0, 6)];
    rule.hour = 23;
    rule.minute = 59;
    schedule.scheduleJob(rule, function(){
        logger.info('scheduleResetWechatUserJob run');

        User.update({'wechat.wechat_uuid':{$exists:true}}, {$set:{'wechat.logged':false}}, {multi:true}, function(err, numberAffected, raw) {
            if (err) {
                logger.warn('scheduleResetWechatUserJob error:' + err.toString());
            } else if (!numberAffected) {
                logger.info('scheduleResetWechatUserJob no user updated');
            } else {
                logger.info('scheduleResetWechatUserJob done for ' + numberAffected + ' users');
            }
        });
    });
};

var testUser = {
    'ogpOvt2YkB-Ehit_yXupvpzev8Nc': true,
    'ogpOvt0IKA-5M2GBtrmptBwYSGYw': true,
    'ogpOvt5E216NjqAbzH0zL5Tf5iBE': true,
    'ogpOvtxeBaoVsR2AYNh5LCCFbWx8': true
};

function processUser(user, callback) {
    var today = moment().startOf('day');

    var test = false;
    if (testUser[user.name]) {
        test = true;
    }
    mockTrader.Order.find({$and:[{userId:user._id}, {timestamp:{$gte:today.toDate()}}]}, function(err, orders) {
        if (err) {
            logger.error('processUser error for user:' + user._id, err.toString());
            callback(null, {hands:0, profit:0, test:test});
        }
        var profit = 0;
        var quantity = 0;
        orders.forEach(function(elem) {
            profit += elem.profit;
            quantity += Math.abs(elem.quantity);
        });
        quantity /= 100;
        var obj = new PPJUserDaily({
            userId: user._id,
            wechat_uuid: user.name,
            hands: quantity,
            profit: profit / 100,
            cash: user.cash
        });
        obj.save(function(err) {
            if (err) {
                logger.error('processUser error when save to db for user:' + user._id, err.toString());
            }
            callback(null, {hands:quantity/2, profit:obj.profit, test:test});
        })
    });
}

module.exports.schedulePPJUserDailyJob = function() {
    logger.info('schedulePPJUserDailyJob start schedule job');
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(0, 6)];
    rule.hour = 19;
    rule.minute = 05;
    schedule.scheduleJob(rule, function() {
        logger.info('schedulePPJUserDailyJob run');

        mockTrader.User.find({real:true}, function(err, users) {
            if (err) {
                logger.error('schedulePPJUserDailyJob error:' + err.toString());
                return;
            }
            var totalTrader = users.length,
                todayTrader = 0,
                profitTrader = 0,
                profit = 0,
                lossTrader = 0,
                loss = 0,
                testResult = 0,
                todayHands = 0;
            async.map(users, processUser, function(err, results) {
                if (err) {
                    return callback(err);
                }
                for (var i in results) {
                    if (results[i].hands > 0) {
                        ++todayTrader;
                        if (results[i].profit >= 0) {
                            ++profitTrader;
                            profit += results[i].profit;
                        } else {
                            ++lossTrader;
                            loss += results[i].profit;
                        }
                    }
                    if (results[i].test) {
                        testResult += results[i].profit;
                    }
                    todayHands += results[i].hands;
                }
                var content = '今日操盘手个数:' + todayTrader + '\r\n' +
                        '操盘手总数:' + totalTrader + '\r\n' +
                        '今日用户交易手数:' + todayHands + '\r\n' +
                        '今日盈利操盘手人数:' + profitTrader + '\r\n' +
                        '今日盈利总数:' + profit.toFixed(2) + '\r\n' +
                        '今日亏损操盘手人数:' + lossTrader + '\r\n' +
                        '今日亏损总数:' + loss.toFixed(2) + '\r\n' +
                        '今日测试账号盈亏:' + testResult.toFixed(2) + '\r\n';
                util.sendEmail('chengxiang@niujinwang.com', '交易快手实盘今日数据', content, function(err) {
                    if (err) {
                        logger.debug('error when send ppj today user data ' + err.toString());
                    }
                });
                logger.info('schedulePPJUserDailyJob done');
            })
        });
    });
};
