var schedule = require('node-schedule'),
    sms = require('./sms'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    Apply = require('../models/Apply'),
    User = require('../models/User'),
    DailyData = require('../models/DailyData'),
    Contract = require('../models/Contract'),
    log4js = require('log4js'),
    logger = log4js.getLogger('task'),
    needle = require('needle'),
    async = require('async'),
    config = require('../config/config')['production'],
    invest = require('./invest'),
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
    if (!apply.autoPostpone) {
        util.sendSMS_13(apply.userMobile, apply.amount, apply.account);
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
            util.sendSMS_13(apply.userMobile, apply.amount, apply.account);
        } else if (resp.statusCode != 200) {
            logger.warn(resp.body);
            feedback = apply.account + ' send sms';
            util.sendSMS_13(apply.userMobile, apply.amount, apply.account);
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
        });

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
                });
            }
        });
    });
};

module.exports.scheduleDailyDataJob = function() {
    logger.info('scheduleDailyDataJob start schedule job');
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(0, 6)];
    rule.hour = 20;
    rule.minute = 00;
    schedule.scheduleJob(rule, function(){
        logger.info('scheduleDailyDataJob run');

        var options = {};
        mongoose.connect(config.db, options);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error...'));
        db.once('open', function callback() {
            console.log('goldenbull db opened for scheduleDailyDataJob');
        });

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
        Apply.findOne({serialID:contract.applySerialID}, function(err, apply) {
            if (err) {
                logger.info('checkContract error ' + err.toString());
                callback(null);
            } else {
                if (!apply) {
                    logger.info('checkContract error apply not found');
                    callback(null);
                } else {
                    if (apply.status != 2) {
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
            }
        });
    }
}

module.exports.scheduleContractCheckJob = function() {
    logger.info('scheduleContractCheckJob start schedule job');
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(0, 6)];
    rule.hour = 21;
    rule.minute = 00;
    schedule.scheduleJob(rule, function() {
        logger.info('scheduleContractCheckJob run');

        var options = {};
        mongoose.connect(config.db, options);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error...'));
        db.once('open', function callback() {
            console.log('goldenbull db opened for scheduleContractCheckJob');
        });

        Contract.find({status:1}, function(err, contracts) {
            async.mapSeries(contracts, checkContract, function(err, results) {
                if (err) {
                    logger.warn('scheduleContractCheckJob error:' + err.toString());
                } else {
                    logger.info('scheduleContractCheckJob done');
                }
            });
        });
    });
};
