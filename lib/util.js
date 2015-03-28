var moment = require('moment'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    ForbiddenStock = require('../models/ForbiddenStock'),
    sms = require('./sms');
    _ = require('lodash');

module.exports.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

module.exports.generateSerialID = function() {
    var sid = moment().format("YYYYMMDDHHmmSSS");
    sid += exports.getRandomInt(0, 9);
    return sid;
};

var holiday = [
    moment("2015-03-14").dayOfYear(),
    moment("2015-03-15").dayOfYear(),
    moment("2015-03-21").dayOfYear(),
    moment("2015-03-22").dayOfYear(),
    moment("2015-03-28").dayOfYear(),
    moment("2015-03-29").dayOfYear(),
    moment("2015-04-04").dayOfYear(),
    moment("2015-04-05").dayOfYear(),
    moment("2015-04-06").dayOfYear(),
    moment("2015-04-11").dayOfYear(),
    moment("2015-04-12").dayOfYear(),
    moment("2015-04-18").dayOfYear(),
    moment("2015-04-19").dayOfYear(),
    moment("2015-04-25").dayOfYear(),
    moment("2015-04-26").dayOfYear(),
    moment("2015-05-01").dayOfYear(),
    moment("2015-05-02").dayOfYear(),
    moment("2015-05-03").dayOfYear(),
    moment("2015-05-09").dayOfYear(),
    moment("2015-05-10").dayOfYear(),
    moment("2015-05-16").dayOfYear(),
    moment("2015-05-17").dayOfYear(),
    moment("2015-05-23").dayOfYear(),
    moment("2015-05-24").dayOfYear(),
    moment("2015-06-06").dayOfYear(),
    moment("2015-06-07").dayOfYear(),
    moment("2015-06-13").dayOfYear(),
    moment("2015-06-14").dayOfYear(),
    moment("2015-06-20").dayOfYear(),
    moment("2015-06-21").dayOfYear(),
    moment("2015-06-22").dayOfYear(),
    moment("2015-06-27").dayOfYear(),
    moment("2015-06-28").dayOfYear(),
    moment("2015-07-04").dayOfYear(),
    moment("2015-07-05").dayOfYear(),
    moment("2015-07-11").dayOfYear(),
    moment("2015-07-12").dayOfYear(),
    moment("2015-07-18").dayOfYear(),
    moment("2015-07-19").dayOfYear(),
    moment("2015-07-25").dayOfYear(),
    moment("2015-07-26").dayOfYear(),
    moment("2015-08-01").dayOfYear(),
    moment("2015-08-02").dayOfYear(),
    moment("2015-08-08").dayOfYear(),
    moment("2015-08-09").dayOfYear(),
    moment("2015-08-15").dayOfYear(),
    moment("2015-08-16").dayOfYear(),
    moment("2015-08-22").dayOfYear(),
    moment("2015-08-23").dayOfYear(),
    moment("2015-08-29").dayOfYear(),
    moment("2015-08-30").dayOfYear(),
    moment("2015-09-05").dayOfYear(),
    moment("2015-09-06").dayOfYear(),
    moment("2015-09-12").dayOfYear(),
    moment("2015-09-13").dayOfYear(),
    moment("2015-09-19").dayOfYear(),
    moment("2015-09-20").dayOfYear(),
    moment("2015-09-26").dayOfYear(),
    moment("2015-09-27").dayOfYear(),
    moment("2015-10-01").dayOfYear(),
    moment("2015-10-02").dayOfYear(),
    moment("2015-10-03").dayOfYear(),
    moment("2015-10-04").dayOfYear(),
    moment("2015-10-05").dayOfYear(),
    moment("2015-10-06").dayOfYear(),
    moment("2015-10-07").dayOfYear(),
    moment("2015-10-10").dayOfYear(),
    moment("2015-10-11").dayOfYear(),
    moment("2015-10-17").dayOfYear(),
    moment("2015-10-18").dayOfYear(),
    moment("2015-10-24").dayOfYear(),
    moment("2015-10-25").dayOfYear(),
    moment("2015-10-31").dayOfYear(),
    moment("2015-11-01").dayOfYear(),
    moment("2015-11-07").dayOfYear(),
    moment("2015-11-08").dayOfYear(),
    moment("2015-11-14").dayOfYear(),
    moment("2015-11-15").dayOfYear(),
    moment("2015-11-21").dayOfYear(),
    moment("2015-11-22").dayOfYear(),
    moment("2015-11-28").dayOfYear(),
    moment("2015-11-29").dayOfYear(),
    moment("2015-12-05").dayOfYear(),
    moment("2015-12-06").dayOfYear(),
    moment("2015-12-12").dayOfYear(),
    moment("2015-12-13").dayOfYear(),
    moment("2015-12-19").dayOfYear(),
    moment("2015-12-20").dayOfYear(),
    moment("2015-12-26").dayOfYear(),
    moment("2015-12-27").dayOfYear()
];

var sms_macro = [
    {
        name: 'withdraw_sms_content',
        value: 0,
        content: 'AMOUNT元资金提现已完成，请注意查收，当前牛金可用余额为BALANCE元。'
    },
    {
        name: 'get_profit_sms_content',
        value: 1,
        content: '您的盈利提取申请已经处理，资金已划入您在牛金网的余额'
    },
    {
        name: 'approve_apply_sms_content',
        value: 2,
        content: 'AMOUNT元资金已到账，股票账号ACCOUNT，登录密码PASSWORD，请勿向任何人泄露！'
    },
    {
        name: 'close_apply_sms_content',
        value: 3,
        content: '业务结算AMOUNT元（保证金DEPOSIT元，收益PROFIT元）已完成，祝您投资愉快。'
    },
    {
        name: 'pay_success_sms_content',
        value: 4,
        content: '您于TIME在牛金网充值AMOUNT元，资金已经到账，感谢您对牛金网的支持，祝您投资愉快。'
    },
    {
        name: 'warn_sms_content',
        value: 5,
        content: '您有一笔金额为TOTAL_AMOUNT元的操盘业务已经亏损到达警戒线WARN_AMOUNT元，请尽快追加保证金以维持仓位，您可以登录牛金网进行操作，或者联系QQ客服400 692 1388或电话客服400 692 1388。感谢您对牛金网的支持，祝您投资愉快。'
    },
    {
        name: 'sell_sms_content',
        value: 6,
        content: '您有一笔金额为TOTAL_AMOUNT元的操盘业务已经亏损到达平仓线SELL_AMOUNT元，系统已经将交易账户平仓，请登录牛金网查看相应信息，或者联系QQ客服400 692 1388或电话客服400 692 1388。感谢您对牛金网的支持，祝您投资愉快。'
    },
    {
    }
];

module.exports.getStartDay = function() {
    var startDay = moment().startOf('day');
    if (moment().hour() > 14) {
        startDay = moment().endOf('day').add(1, 'ms');
    }

    while (true) {
        var dayOfYear = startDay.dayOfYear();
        if (holiday.indexOf(dayOfYear) === -1) {
            break;
        }
        startDay = startDay.add(1, 'day');
    }
    return startDay;
};

module.exports.getEndDay = function(startDay, days) {
    --days;
    var endDay = startDay.clone();
    while (days) {
        endDay = endDay.add(1, 'day');
        if (holiday.indexOf(endDay.dayOfYear()) !== -1) continue;
        --days;
    }
    endDay.hour(14);
    endDay.minute(54);
    endDay.second(59);
    return endDay;
};

module.exports.tradeDaysFromEndDay = function(endDay, days) {
    var dayOfYear = moment(endDay).dayOfYear();
    var ret = 0;
    --days;
    while (days) {
        if (holiday.indexOf(dayOfYear) === -1) {
            --days;
        }
        --dayOfYear;
        ++ret;
    }
    return ret;
};

module.exports.getServiceFee = function(amount, period) {
    return amount / 10000 * config.serviceCharge * period;
};

module.exports.fetchForbiddenStocks = function(cb) {
    var date = moment().startOf('day').toDate();
    ForbiddenStock.find({date: {$gte:date}}, function(err, stocks) {
        if (err) {
            logger.warn(err.toString());
            cb(err);
        }
        cb(null, stocks);
    });
};

module.exports.addForbiddenStocks = function(stocks) {
    stocks.forEach(function(stock, index, array) {
        ForbiddenStock.create({stockID: stock.id, stockName: stock.name});
    });
};

module.exports.sendSMS_0 = function(mobile, time, amount) {
    var message_content = sms_macro[0].content.replace('TIME', time).replace('AMOUNT', amount);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_1 = function(mobile) {
    sms.sendSMS(mobile, '', sms_macro[1].content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_2 = function(mobile, amount, accout, password) {
    var message_content = sms_macro[2].content.replace('AMOUNT', amount).replace('ACCOUNT', account).replace('PASSWORD', password);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_3 = function(mobile, amount, deposit, profit) {
    var message_content = sms_macro[3].content.replace('AMOUNT', amount).replace('DEPOSIT', deposit).replace('PROFIT', profit);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_4 = function(mobile, time, amount) {
    var message_content = sms_macro[4].content.replace('TIME', time).replace('AMOUNT', amount);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

/*
module.exports.sendSMS_5 = function(mobile, total, warn) {
    var message_content = sms_macro[5].content.replace('TOTAL_AMOUNT', total).replace('WARN_AMOUNT', warn);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};
*/
