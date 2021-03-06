var moment = require('moment'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    ForbiddenStock = require('../models/ForbiddenStock'),
    Order = require('../models/Order'),
    Apply = require('../models/Apply'),
    User = require('../models/User'),
    sms = require('./sms'),
    async = require('async'),
    useragent = require('useragent'),
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
    },
    {
        name: 'apply_sell_content',
        value: 9,
        content: 'AMOUNT元配资今天到期，请在14:50前平仓。祝您操盘愉快！'
    },
    {
        name: 'free_apply_sell_content',
        value: 10,
        content: '2000元免费体验配资今天到期，请在14:00前平仓。祝您操盘愉快！'
    }
];

var getStartDay = function() {
    var startDay = moment().startOf('day');
    if (moment().hour() >= 14) {
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

var getEndDay = function(startDay, period, type) {
    var endDay = startDay.clone();
    if (type && type === 2) {
        endDay = endDay.add(period, 'months');
        while (holiday.indexOf(endDay.dayOfYear()) !== -1) {
            endDay = endDay.add(1, 'day');
        }
        return endDay;
    }
    --period;
    while (period) {
        endDay = endDay.add(1, 'day');
        if (holiday.indexOf(endDay.dayOfYear()) !== -1) continue;
        --period;
    }
    endDay.hour(14);
    endDay.minute(50);
    endDay.second(00);
    return endDay;
};

var getServiceCharge = function(lever) {
    switch (lever) {
        case 10:
            return 19.9;
        case 9:
            return 18.9;
        case 8:
            return 17.9;
        case 7:
            return 16.9;
        case 6:
            return 15.9;
        case 5:
            return 10.9;
        case 4:
            return 10.9;
        case 3:
            return 10.9;
        case 2:
            return 10.9;
        default:
            return 19.9;
    }
};

var getServiceFee = function(apply, period) {
    if (apply.type && apply.type === 2) {
        return (apply.amount - apply.deposit) * apply.interestRate;
    }
    return apply.amount / 10000 * getServiceCharge(apply.lever) * apply.period;
};

var orderFinished = function(user, order, orderType, cb) { // orderType 1 means income, 2 means outcome
    async.waterfall([
        function(callback) {
            if (order.status === 1) {
                callback('order already confirmed');
            } else {
                var balance = Number(user.finance.balance.toFixed(2));
                var amount = Number(order.amount.toFixed(2));
                if (orderType === 2) {
                    if (balance < amount) {
                        callback('not enough balance to pay the order');
                        return;
                    }
                    order.userBalance = balance - amount;
                } else {
                    order.userBalance = balance + amount;
                }

                order.status = 1;
                order.save(function(err) {
                    callback(err, user, order);
                });
            }
        },
        function(user, order, callback) {
            user.finance.balance = order.userBalance;
            user.save(function (err) {
                callback(err);
            });
        }
    ], function(err){
        cb(err);
    });
};

module.exports.getStartDay = getStartDay;

module.exports.getEndDay = getEndDay;

var tradeDaysTillNow = function(startDay, days) {
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

module.exports.tradeDaysTillNow = tradeDaysTillNow;

module.exports.getServiceFee = getServiceFee;

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

module.exports.sendSMS_9 = function(mobile, amount) {
    if (!mobile) {
        console.log('sendSMS_9 error:not all required params provided');
        return {error_code:1, error_msg:'not all required params provided'};
    }
    var message_content = sms_macro[9].content.replace('AMOUNT', amount);
    sms.sendSMS(mobile, '', message_content, function (result) {
        if (result.error) {
            return {error_code:1, error_msg:result.msg};
        } else {
            return {error_code:0};
        }
    });
};

module.exports.sendSMS_10 = function(mobile) {
    if (!mobile) {
        console.log('sendSMS_10 error:not all required params provided');
        return {error_code:1, error_msg:'not all required params provided'};
    }
    var message_content = sms_macro[10].content;
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

module.exports.displayApplyStatus = function(input) {
    switch (input) {
        case 1:
            return "待支付";
        case 2:
            return "操盘中";
        case 3:
            return "已结算";
        case 4:
            return "资金划拨中";
        case 5:
            return "结算中";
        case 9:
            return "排队中";
        default:
            return "待支付";
    }
};

module.exports.applyDepositAdded = function(user, apply, amount, cb) {
    async.waterfall([
        function(callback) {
            var orderData = {
                userID: apply.userID,
                userMobile: apply.userMobile,
                dealType: 9,
                amount: Number(amount.toFixed(2)),
                status: 2,
                description: '追加配资保证金',
                applySerialID: apply.serialID
            };
            Order.create(orderData, function(err, order) {
                if (!err && !order) {
                    err = 'can not create pay order when add deposit for apply:' + serial_id;
                }
                callback(err, user, order, apply);
            });
        },
        function(user, order, apply, callback) {
            orderFinished(user, order, 2, function(err) {
                callback(err, user, order, apply);
            });
        },
        function(user, order, apply, callback) {
            apply.deposit += order.amount;
            apply.save(function(err) {
                if (err) {
                    callback(err);
                } else {
                    user.finance.deposit += order.amount;
                    user.finance.history_deposit += order.amount;
                    user.save(function(err) {
                        callback(err, "done");
                    });
                }
            });
        }
    ], function(err) {
        cb(err);
    });
};

module.exports.applyConfirmed = function(user, apply, cb) {
    async.waterfall([
        function(callback) {
            if (apply.status > 1) {
                callback('apply already confirmed');
            } else {
                var startDay = getStartDay();
                apply.startTime = startDay.toDate();
                apply.endTime = getEndDay(startDay, apply.period, apply.type).toDate();
                apply.status = 4;
                apply.save(function(err) {
                    callback(err, apply);
                });
            }
        },
        function(apply, callback) { // for deposit output
            var orderData = {
                userID: user._id,
                userMobile: user.mobile,
                dealType: 9,
                amount: apply.deposit,
                status: 2,
                description: '缴纳配资保证金',
                applySerialID: apply.serialID
            };
            Order.create(orderData, function(err, order) {
                if (!err && !order) {
                    err = 'can not create pay order when pay apply:' + apply.serialID;
                }
                callback(err, order);
            });
        },
        function(order, callback) {
            orderFinished(user, order, 2, function(err) {
                callback(err, user);
            });
        },
        function(user, callback) {
            var serviceFee = getServiceFee(apply, apply.period);
            if (!apply.isTrial) {
                var orderData = {
                    userID: user._id,
                    userMobile: user.mobile,
                    dealType: 10,
                    amount: serviceFee,
                    status: 2,
                    description: '缴纳管理费',
                    applySerialID: apply.serialID
                };
                Order.create(orderData, function(err, order) {
                    if (!err && !order) {
                        err = 'can not create service fee order when pay apply:' + apply.serialID;
                    }
                    callback(err, order, serviceFee);
                });
            } else {
                callback(null, null, 0);
            }
        },
        function (order, serviceFee, callback) {
            if (order) {
                orderFinished(user, order, 2, function(err) {
                    callback(err, user, serviceFee);
                });
            } else {
                callback(null, user, serviceFee);
            }
        },
        function(user, serviceFee, callback) {
            user.finance.total_capital += apply.amount;
            user.finance.history_capital += apply.amount;
            user.finance.deposit += apply.deposit;
            user.finance.history_deposit += apply.deposit;
            user.finance.freeze_capital += serviceFee;
            user.save(function (err) {
                callback(err);
            });
        }
    ], function(err) {
        cb(err);
    });
};

module.exports.applyClosed = function(user, apply, profit, cb) {
    async.waterfall([
        function(callback) {
            if (apply.status != 5) {
                callback('apply not in closing state');
            } else {
                apply.status = 3;
                apply.profit = profit;
                apply.save(function(err) {
                    callback(err);
                });
            }
        },
        function(callback) {
            if (profit > 0) {
                var orderData = {
                    userID: user._id,
                    userMobile: user.mobile,
                    dealType: 4,
                    amount: profit,
                    status: 2,
                    description: '股票盈利返还',
                    applySerialID: apply.serialID
                };
                Order.create(orderData, function(err, order) {
                    if (!err && !order) {
                        err = 'can not create profit return order when close apply:' + apply.serialID;
                    }
                    callback(err, order);
                });
            } else {
                callback(null, null);
            }
        },
        function(order, callback) {
            if (order) {
                orderFinished(user, order, 1, callback);
            } else {
                callback(null);
            }
        },
        function(callback) {
            var returned_deposit = 0;
            if (profit > 0) {
                returned_deposit += apply.deposit;
            } else {
                var left = apply.deposit + profit;
                if (left > 0) {
                    returned_deposit = left;
                }
                if (apply.isTrial) {
                    returned_deposit = 1;
                }
            }
            if (returned_deposit > 0 || apply.type !== 2) {
                var orderData = {
                    userID: user._id,
                    userMobile: user.mobile,
                    dealType: 5,
                    amount: returned_deposit,
                    status: 2,
                    description: '保证金返还',
                    applySerialID: apply.serialID
                };
                Order.create(orderData, function(err, order) {
                    if (!err && !order) {
                        err = 'can not create deposit return order when close apply:' + apply.serialID;
                    }
                    callback(err, order);
                });
            } else {
                callback(null, null);
            }
        },
        function(order, callback) {
            if (order) {
                orderFinished(user, order, 1, function(err) {
                    callback(err);
                });
            } else {
                callback(null);
            }
        },
        function(callback) {
            if (!apply.isTrial) {
                var tradeDays = tradeDaysTillNow(apply.startTime, apply.period);
                var totalServiceFee = getServiceFee(apply, apply.period);
                var actualServiceFee = getServiceFee(apply, tradeDays);
                var returnedServiceFee = totalServiceFee - actualServiceFee;
                if (totalServiceFee > 0) {
                    user.finance.freeze_capital -= totalServiceFee;
                }
                if (returnedServiceFee > 0) {
                    var orderData = {
                        userID: apply.userID,
                        userMobile: user.mobile,
                        dealType: 8,
                        amount: returnedServiceFee,
                        status: 2,
                        description: '管理费返还',
                        applySerialID: apply.serialID
                    };
                    Order.create(orderData, function(err, order) {
                        if (!err && !order) {
                            err = 'can not create service fee return order when close apply:' + apply.serialID;
                        }
                        callback(err, order);
                    });
                } else {
                    callback(null, null);
                }
            }
        },
        function(order, callback) {
            if (order) {
                orderFinished(user, order, 1, callback);
            } else {
                callback(null);
            }
        },
        function(callback) {
            user.finance.total_capital -= apply.amount;
            user.finance.deposit -= apply.deposit;
            if (profit > 0) {
                user.finance.profit += profit;
            }
            user.save(function(err) {
                callback(err);
            });
        }
    ], function(err) {
        cb(err);
    });
};

module.exports.orderFinished = orderFinished;


var privateProperties = [
    '__v',
    'verifyEmailToken',
    'registered',
    'roles',
    'password',
    'manager',
    'resetPasswordToken',
    'resetPasswordExpires'
];

module.exports.getUserViewModel = function (user) {
    var realUser = user._doc;
    var vm = _.omit(realUser, privateProperties);
    return _.extend(vm, {});
};

module.exports.isAndroid = function(ua_str) {
    return useragent.is(ua_str).android;
};

module.exports.isApple = function(ua_str) {
    var agent = useragent.parse(ua_str);
    if (agent.device.toString().search('iPad') > -1 || agent.device.toString().search('iPhone') > -1) {
        return true;
    }
    return false;
};

module.exports.formatDisplayNum = function(num) {
    var str = '';
    var yi = 100000000;
    var wan = 10000;
    if (num >= yi) {
        var v = num / yi;
        num %= yi;
        str += v.toFixed(0) + '亿';
    }
    if (num >= wan) {
        var v = num / wan;
        num %= wan;
        str += v.toFixed(0) + '万'
    }
    if (!str) {
        str = num.toFixed(0) + '元';
    }

    return str;
};

module.exports.debugInfo = function(logger, req) {
    logger.debug(req.headers['user-agent']);
    if (req.user) {
        logger.debug('user ' + req.user.mobile + ' access ' + req.url);
    } else {
        logger.debug('user access ' + req.url);
    }
};