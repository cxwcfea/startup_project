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
        name: 'register_content',
        value: 0,
        content: '验证码：CODE，用于注册，欢迎来到牛金网，为您提供专业贴心的配资服务。'
    },
    {
        name: 'reset_pass_content',
        value: 1,
        content: '验证码：CODE，用于密码重置，请勿泄露给他人！'
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
        content: '充值AMOUNT元已经到账，祝您投资愉快。'
    },
    {
        name: 'warn_sms_content',
        value: 5,
        content: '金额为AMOUNT元的操盘业务已经亏损到达警戒线WARN_AMOUNT元，请尽快追加保证金以维持仓位。'
    },
    {
        name: 'sell_sms_content',
        value: 6,
        content: '金额为AMOUNT元的操盘业务已经亏损到达平仓线SELL_AMOUNT元，系统已经将交易账户平仓，请登录牛金网查看相应信息。'
    },
    {
        name: 'withdraw_content',
        value: 7,
        content: 'AMOUNT元资金提现已完成，请注意查收，当前牛金可用余额为BALANCE元。'
    },
    {
        name: 'alipay_confirm_content',
        value: 8,
        content: 'AMOUNT元支付宝充值已到账，详情登录账户查看。'
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
    endDay.minute(00);
    endDay.second(00);
    return endDay;
};

module.exports.tradeDaysTillNow = function(startDay, days) {
    var startDayOfYear = moment(startDay).dayOfYear();
    var currentDayOfYear = moment().dayOfYear();
    var ret = 0;
    while (currentDayOfYear >= startDayOfYear) {
        if (holiday.indexOf(currentDayOfYear) === -1) {
            ++ret;
        }
        --currentDayOfYear;
    }
    return ret;
};

module.exports.getServiceFee = function(amount, period) {
    return Number((amount / 10000 * config.serviceCharge * period).toFixed(2));
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

module.exports.sendSMS_0 = function(mobile, code) {
    var message_content = sms_macro[0].content.replace('CODE', code);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_1 = function(mobile, code) {
    var message_content = sms_macro[1].content.replace('CODE', code);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_2 = function(mobile, amount, account, password) {
    if (!mobile || !amount || !account | !password) {
        return {error_code:1, error_msg:'not all required params provided'};
    }
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
    if (!mobile) {
        console.log('sendSMS_3 error:not all required params provided');
        return {error_code:1, error_msg:'not all required params provided'};
    }
    var message_content = sms_macro[3].content.replace('AMOUNT', amount).replace('DEPOSIT', deposit).replace('PROFIT', profit);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_4 = function(mobile, amount) {
    var message_content = sms_macro[4].content.replace('AMOUNT', amount);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_5 = function(mobile, amount, warn) {
    if (!mobile) {
        console.log('sendSMS_5 error:not all required params provided');
        return {error_code:1, error_msg:'not all required params provided'};
    }
    var message_content = sms_macro[5].content.replace('AMOUNT', amount).replace('WARN_AMOUNT', warn);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_6 = function(mobile, amount, sell) {
    if (!mobile) {
        console.log('sendSMS_6 error:not all required params provided');
        return {error_code:1, error_msg:'not all required params provided'};
    }
    var message_content = sms_macro[6].content.replace('AMOUNT', amount).replace('SELL_AMOUNT', sell);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_7 = function(mobile, amount, balance) {
    if (!mobile) {
        console.log('sendSMS_7 error:not all required params provided');
        return {error_code:1, error_msg:'not all required params provided'};
    }
    var message_content = sms_macro[7].content.replace('AMOUNT', amount).replace('BALANCE', balance);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_8 = function(mobile, amount) {
    if (!mobile) {
        console.log('sendSMS_8 error:not all required params provided');
        return {error_code:1, error_msg:'not all required params provided'};
    }
    var message_content = sms_macro[8].content.replace('AMOUNT', amount);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.mobileDisplay = function(input) {
    if (input) {
        input = input.toString();
        return input.substr(0, 3) + "****" + input.substr(-4);
    }
    return '';
};
