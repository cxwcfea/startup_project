var schedule = require('node-schedule'),
    sms = require('./sms'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    Apply = require('../models/Apply'),
    User = require('../models/User'),
    Order = require('../models/Order'),
    DailyData = require('../models/DailyData'),
    Contract = require('../models/Contract'),
    OperationData = require('../models/OperationData'),
    log4js = require('log4js'),
    logger = log4js.getLogger('task'),
    needle = require('needle'),
    async = require('async'),
    config = require('../config/config')['production'],
    invest = require('./invest'),
    mockTrader = require('../controllers/mockTrader'),
    util = require('./util');

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
    rule.hour = 19;
    rule.minute = 00;
    schedule.scheduleJob(rule, function(){
        logger.info('scheduleDailyDataJob run');

        var options = {};
        mongoose.connect(config.db, options);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error...'));
        db.once('open', function callback() {
            console.log('goldenbull db opened for scheduleDailyDataJob');
            var data = {};
            async.waterfall([
                function(callback) {
                    util.getTodayActiveApplyData(function(err, dataObj) {
                        if (!err) {
                            data.active_apply_amount = dataObj.amount;
                            data.active_apply_num = dataObj.num;
                            data.today_income = dataObj.total_fee;
                        }
                        callback(err, data);
                    });
                },
                function(data, callback) {
                    util.getTodayUserData(function(err, dataObj) {
                        if (!err) {
                            data.today_user_num = dataObj.num;
                        }
                        callback(err, data);
                    });
                },
                function(data, callback) {
                    util.getMgmReturnFeeData(function(err, dataObj) {
                        if (!err) {
                            data.mgmReturnFee = dataObj.amount;
                        }
                        callback(err, data);
                    });
                },
                function(data, callback) {
                    util.getManualReturnFeeData(function(err, dataObj) {
                        if (!err) {
                            data.manualReturnFee = dataObj.amount;
                        }
                        callback(err, data);
                    });
                },
                function(data, callback) {
                    var isHoliday = util.isHoliday(moment().dayOfYear());
                    if (isHoliday) {
                        data.active_apply_amount = 0;
                        data.active_apply_num = 0;
                        data.today_income = 0;
                    }
                    var today= moment().format('YYYYMMDD');
                    var dataObj = {
                        applyAmount: data.active_apply_amount,
                        applyNum: data.active_apply_num,
                        income: data.today_income,
                        mgmReturnFee: data.mgmReturnFee,
                        manualReturnFee: data.manualReturnFee,
                        newUsers: data.today_user_num,
                        date: today
                    };
                    DailyData.create(dataObj, function(err, dailyData) {
                        if (!err && !dailyData) {
                            err = 'can not create dailyData';
                        }
                        callback(err, 'done');
                    });
                }
            ], function(err, data) {
                if (err) {
                    logger.warn('scheduleDailyDataJob error:' + err.toString());
                } else {
                    logger.info('scheduleDailyDataJob ' + data);
                }
                db.close();
            });
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
    schedule.scheduleJob('*/10 * * * * *', function(){
        logger.info('wind blows...');
        User.find({}, function(err, user) {
            logger.info('wind start');
            if (err) {
                logger.warn('scheduleFuturesRiskControlJob error:' + err.toString());
                return;
            }
            if (!user) {
                logger.warn('scheduleFuturesRiskControlJob error:user not found');
                return;
            }
            for (var i in user) {
                logger.info('checking user ' + user[i]._id);
                mockTrader.windControl(user[i]._id, 0, function (err) {
                    if (err) {
                        logger.warn('scheduleFuturesRiskControlJob error:' + err.toString());
                    }
                });
            }
            logger.info('wind end');
        });
        logger.info('wind stops');
    });
};

module.exports.scheduleFuturesForceCloseJob = function() {
    logger.info('scheduleFuturesForceCloseJob start schedule job');
    var closeJob = function() {
        mockTrader.User.find({status:0}, function(err, user) {
            if (err) {
                logger.warn('scheduleFuturesForceCloseJob error:' + err.toString());
                return;
            }
            if (!user) {
                logger.warn('scheduleFuturesForceCloseJob error:user not found');
                return;
            }
            for (var i in user) {
                mockTrader.windControl(user[i]._id, 1, function (err) {
                    if (err) {
                        logger.warn('scheduleFuturesForceCloseJob error:' + err.toString());
                    }
                    logger.info('scheduleFuturesForceCloseJob done');
                });
            }
        });
    };

    rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(1, 5)];
    rule.hour = 9;
    rule.minute = 14;
    schedule.scheduleJob(rule, closeJob);

    rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(1, 5)];
    rule.hour = 11;
    rule.minute = 31;
    schedule.scheduleJob(rule, closeJob);

    rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(1, 5)];
    rule.hour = 12;
    rule.minute = 59;
    schedule.scheduleJob(rule, closeJob);

    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(1, 5)];
    rule.hour = 15;
    rule.minute = 16;
    schedule.scheduleJob(rule, closeJob);
};
