var schedule = require('node-schedule'),
    sms = require('./sms'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    Apply = require('../models/Apply'),
    User = require('../models/User'),
    log4js = require('log4js'),
    logger = log4js.getLogger('task'),
    needle = require('needle'),
    async = require('async'),
    config = require('../config/config')['production'];
    util = require('./util');

module.exports.scheduleJob = function() {
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(0, 6)];
    rule.hour = 20;
    rule.minute = 40;
    schedule.scheduleJob(rule, function(){
        console.log('The answer to life, the universe, and everything!');
        util.sendEmail('cxwcfea@163.com', 'task test', 'test task which run at 18 everyday', function(err) {
        });
    });
};

function postponeUserApply(apply, callback) {
    var url = 'http://localhost:3000/api/auto_postpone_apply';
    var options = {
        json: true,
        follow_max: 3 // follow up to three redirects
    };
    needle.post(url, {serial_id:apply.serialID}, options, function(err, resp, body) {
        var feedback = '';
        if (err) {
            logger.warn(err.toString());
            util.sendSMS_13(apply.userMobile, apply.amount, apply.account);
        } else if (resp.statusCode != 200) {
            logger.warn(resp.body);
            util.sendSMS_13(apply.userMobile, apply.amount, apply.account);
        } else {
            feedback = apply.account;
            logger.info('scheduleAutoPostponeJob success postpone for apply:' + apply.serialID);
        }
        callback(null, feedback);
    });
}

module.exports.scheduleAutoPostponeJob = function() {
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [new schedule.Range(0, 6)];
    rule.hour = 17;
    rule.minute = 00;
    schedule.scheduleJob(rule, function(){
        logger.info('scheduleAutoPostponeJob run');

        var options = {};
        mongoose.connect(config.db, options);
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error...'));
        db.once('open', function callback() {
            console.log('goldenbull db opened for scheduleAutoPostponeJob');
        });

        var startTime = moment();
        var endTime = util.getEndDay(startTime, 2);
        endTime.hour(15);
        endTime.minute(10);
        endTime.second(00);

        Apply.find({ $and: [{ endTime: {$lte: endTime } }, {status: 2}, {autoPostpone: true}] }, function(err, applies) {
            logger.info('scheduleAutoPostponeJob run' + applies.length);
            if (err) {
                logger.warn('scheduleAutoPostponeJob error' + err.toString());
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
