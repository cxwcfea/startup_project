var User = require('../models/User'),
    Order = require('../models/Order'),
    Card = require('../models/Card'),
    util = require('../lib/util'),
    sms = require('../lib/sms'),
    mockTrader = require('./mockTrader'),
    ctpTrader = require('./ctpTrader'),
    _ = require('lodash'),
    moment = require('moment'),
    async = require('async'),
    log4js = require('log4js'),
    logger = log4js.getLogger('futures');

var CLOSE_LINE = 5000;
var WARN_LINE = 10000;

var SILVER_CLOSE_LINE = 500;
var SILVER_WARN_LINE = 550;

var SUPPORT_NUM = '15811087507';
var RISKCONTROL_NUM = '18911468685';
var FINANCE_NUM1 = '13641012331';
var FINANCE_NUM2 = '13811226078';

var privateProperties = [
    '__v',
    'verifyEmailToken',
    'registered',
    'roles',
    'password',
    'manager',
    'resetPasswordToken',
    'resetPasswordExpires',
    'invest',
    'finance',
    'mobile',
    'wechat.wechat_uuid',
    'trader._id',
    'trader.__v'
];

var getUserViewModel = function (user) {
    var realUser = user._doc;
    var vm = _.omit(realUser, privateProperties);
    return vm;
};

function populatePPJUser(user, cb) {
    var query = User.findById(user._id);
    query.populate('wechat.trader');
    query.populate('wechat.real_trader');
    query.populate('wechat.silverTrader');
    query.populate('wechat.real_silverTrader');
    query.exec(function(err, u) {
        if (err) {
            cb(err);
        } else {
            var vm = getUserViewModel(u);
            cb(null, vm);
        }
    });
}

function home(req, res, next) {
    if (req.user) {
        populatePPJUser(req.user, function(err, user) {
            if (err) {
                return next();
            }
            res.render('futures/index', {
                layout:null,
                bootstrappedUserObject: JSON.stringify(user)
            });
        });
    } else {
        res.render('futures/index', {
            layout:null
        });
    }
}

function realHome(req, res, next) {
    if (req.user.wechat.status > 0) {
        populatePPJUser(req.user, function(err, user) {
            if (err) {
                return next();
            }
            user.real = true;
            res.render('futures/index', {
                layout:null,
                bootstrappedUserObject: JSON.stringify(user)
            });
        });
    } else {
        res.render('not_valid_trader', {
            layout: null
        });
    }
}

function fetchUserRankData(req, res) {
    var productID = req.query.product;
    var query = User.find({});
    query.exists('wechat.wechat_uuid');
    if (productID == 0) {
        query.populate('wechat.trader');
    } else if (productID == 1) {
        query.exists('wechat.silverTrader');
        query.populate('wechat.silverTrader');
    }
    query.select('wechat identity');
    query.exec(function(err, users) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        users.sort(function(x, y) {
            if (productID == 0) {
                if (y.wechat.trader && x.wechat.trader) {
                    return y.wechat.trader.lastCash - x.wechat.trader.lastCash;
                }
            } else if (productID == 1) {
                if (y.wechat.silverTrader && x.wechat.silverTrader) {
                    return y.wechat.silverTrader.lastCash - x.wechat.silverTrader.lastCash;
                } else if (x.silverTrader) {
                    return false;
                }
            }
            return true;
        });
        users = users.slice(0, 20);
        var userInRank = false;
        for (var i = 0; i < users.length; ++i) {
            if (req.user.wechat.wechat_uuid == users[i].wechat.wechat_uuid) {
                userInRank = true;
                break;
            }
        }
        res.send({users:users, userInRank:userInRank});
    });
}

function getErrorMessage(err) {
    var msg;
    switch (err.code) {
        case 1:
            msg = '无效的购买数量';
            break;
        case 3:
            msg = '账户已被冻结';
            break;
        case 4:
            msg = '请稍后再试';
            break;
        case 5:
            msg = '余额不足1手';
            break;
        case 6:
            msg = '请先平仓';
            break;
        case 7:
            msg = '同时持仓不能多于10手';
            break;
        case 8:
            msg = '正在连接交易所，请稍后';
            break;
        default:
            msg = '内部错误';
            break;
    }
    return msg;
}

function placeOrder(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    logger.info('placeOrder', req.user, req.body);
    var quantity = req.body.quantity;
    var forceClose = req.body.forceClose;
    var productID = req.body.product;

    var contract;
    switch (parseInt(req.body.product)) {
        case 0: // IF
            contract = {exchange:'future', stock_code:'IFCURR'};
            break;
        case 1: // AG
            contract = {exchange:'future', stock_code:'agCURR'};
            break;
        /*
         case 2: // XAUUSD
         obj.order.contract = {exchange:'commodity', stock_code:'XAUUSD'};
         break;
         case 3: // BABA
         obj.order.contract = {exchange:'stock', stock_code:'BABA'};
         break;
         */
        default :
            contract = {exchange:'future', stock_code:'IFCURR'};
    }
    req.body.contract = contract;
    if (forceClose) {
        req.body.force_close = 1;
        if (req.body.type == 1) {
            if (productID == 0) {
                req.body.user_id = req.user.wechat.real_trader;
            } else if (productID == 1) {
                req.body.user_id = req.user.wechat.real_silverTrader;
            }
            ctpTrader.riskControl(req, res);
        } else {
            if (productID == 0) {
                req.body.user_id = req.user.wechat.trader;
            } else if (productID == 1) {
                req.body.user_id = req.user.wechat.silverTrader;
            }
            mockTrader.riskControl(req, res);
        }
    } else {
        var obj = {
            order: {
                quantity: quantity,
                contract: contract
            }
        };

        var trader = fetchTraderID(req.user, req.body.type, productID);
        if (req.body.type == 1) {
            obj.user_id = trader;
            ctpTrader.createOrder(obj, function(err, order) {
                if (err) {
                    var msg = getErrorMessage(err);
                    return res.status(500).send({error_msg:msg});
                }
                res.send(order);
            });
        } else {
            obj.user_id = trader;
            mockTrader.createOrder(obj, function(err, order) {
                if (err) {
                    logger.error('placeOrder error:' + err.msg);
                    var msg = getErrorMessage(err);
                    return res.status(500).send({error_msg:msg});
                }
                res.send(order);
            });
        }
    }
}

// requestType 0 means mock, 1 means real
function fetchTraderID(user, requestType, product) {
    var trader = user.wechat.trader;
    if (requestType == 1) {
        if (product == 0) {
            trader = user.wechat.real_trader ? user.wechat.real_trader : user.wechat.trader;
        } else if (product == 1) {
            trader = user.wechat.real_silverTrader ? user.wechat.real_silverTrader : user.wechat.silverTrader;
        }
    } else {
        if (product == 0) {
            trader = user.wechat.trader;
        } else if (product == 1) {
            trader = user.wechat.silverTrader;
        }
    }
    return trader;
}

function getPositions(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    var trader = fetchTraderID(req.user, req.query.type, req.query.product);
    mockTrader.getPositions({user_id:trader}, function(err, positions) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        mockTrader.getUserInfo({user_id:trader}, function(err, user) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            res.send({position:positions[0], user:user});
        });
    });
}

function getOrders(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    var page = req.page;
    req.body.date_begin = 0;
    req.body.date_end = Date.now();
    req.body.page = page;
    req.body.user_id = fetchTraderID(req.user, req.query.type, req.query.product);
    mockTrader.getHistoryOrders(req, res);
}

function getNearestOrders(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }

    var orderStartTime = moment().subtract(2.5, 'hours').toDate();

    var userID = fetchTraderID(req.user, req.query.type, req.query.product);

    var query = mockTrader.Order.find({$and: [
        {userId: userID},
        {timestamp: {$gte: orderStartTime}}
    ]});
    query.exec(function(err, orders) {
        if (err) {
            console.log(err);
            return res.status(500).send({error_msg: err.errmsg});
        }
        res.send(orders);
    });
}

function getUserProfit(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    switch (parseInt(req.query.product)) {
        case 0: // IF
            req.body.contract = {exchange:'future', stock_code:'IFCURR'};
            break;
        case 1: // AG
            req.body.contract = {exchange:'future', stock_code:'agCURR'};
            break;
        /*
        case 2: // XAUUSD
            req.body.contract = {exchange:'commodity', stock_code:'XAUUSD'};
            break;
        case 3: // BABA
            req.body.contract = {exchange:'stock', stock_code:'BABA'};
            break;
            */
        default :
            req.body.contract = {exchange:'future', stock_code:'IFCURR'};
    }
    req.body.user_id = fetchTraderID(req.user, req.query.type, req.query.product);
    mockTrader.getProfit(req, res);
}

function test(req, res) {
    var query = User.find({});
    query.exists('wechat.wechat_uuid');
    query.populate('wechat.trader');
    query.select('wechat').exec(function(err, users) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        var userInRank = false;
        for (var i = 0; i < users.length; ++i) {
            if (users[i].wechat.wechat_uuid == req.user.wechat.wechat_uuid) {
                userInRank = true;
                break;
            }
        }
        res.send({users:users, userInRank:userInRank});
    });
}

function getOrderCount(fn) {
    mockTrader.Order.count({}, fn);
}

function getUserInfo(req, res) {
    var trader = fetchTraderID(req.user, req.query.type, req.query.product);
    mockTrader.getUserInfo({user_id:trader}, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(500).send({error_msg:'user not found'});
        }
        res.send(user);
    });
}

function resetUser(req, res) {
    var trader = fetchTraderID(req.user, 0, req.query.product);
    mockTrader.resetUser(trader, function(err) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        res.send({});
    });
}

function makeAppointment(req, res) {
    console.log('makeAppintment ' + req.body);
    if (!req.body.mobile) {
        return res.status(400).send({error_msg:'无效的手机号'});
    }
    req.user.wechat.mobile = req.body.mobile;
    req.user.wechat.appointment = true;
    req.user.wechat.appointmentAt = Date.now();
    req.user.save(function(err) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        sms.sendSMS(SUPPORT_NUM, null, '客户（' + req.user.wechat.mobile + '）刚刚预约了实盘');
        res.send({});
    });
}

function approveUser(req, res) {
    logger.info('approveUser operate by ' + req.user.mobile, req.query);
    var uid = req.query.uid;
    User.findById(uid, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(500).send({error_msg:'无法更新用户'});
        }
        user.wechat.appointment = false;
        if (user.wechat.status === 0) {
            if (user.identity.id) {
                if (user.wechat.real_trader) {
                    user.wechat.status = 6;
                } else {
                    user.wechat.status = 2;
                }
            } else {
                user.wechat.status = 1;
            }
        }
        if (user.wechat.silverStatus === 0) {
            if (user.identity.id) {
                if (user.wechat.real_silverTrader) {
                    user.wechat.silverStatus = 6;
                } else {
                    user.wechat.silverStatus = 2;
                }
            } else {
                user.wechat.silverStatus = 1;
            }
        }
        user.save(function(err) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            res.send({});
        })
    });
}

function createAccount(req, res) {
    logger.debug('createAccount operate by ' + req.user.mobile, req.query);
    var uid = req.query.uid;
    User.findById(uid, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(500).send({error_msg:'user not found'});
        }
        mockTrader.createUser({
            name: user.wechat.wechat_uuid,
            status: 1,
            real: true
        }, function(err, trader) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            if (!trader) {
                return res.status(500).send({error_msg:'can not create trader'});
            }
            mockTrader.createUser({
                name: user.wechat.wechat_uuid,
                status: 1,
                productType: 1,
                real: true
            }, function(err, trader2) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                if (!trader) {
                    return res.status(500).send({error_msg:'can not create trader'});
                }
                user.wechat.appointment = false;
                user.wechat.real_trader = trader;
                user.wechat.real_silverTrader = trader2;
                user.wechat.status = 6;
                user.wechat.silverStatus = 6;
                user.save(function(err) {
                    if (err) {
                        return res.status(500).send({error_msg:err.toString()});
                    }
                    res.send({});
                });
            });
        });
    });
}

function addMoney(req, res) {
    logger.debug('addMoney operate by ' + req.user.mobile, req.body);
    var depositAmount = req.body.amount;
    if (!depositAmount || depositAmount < 0) {
        return res.status(403).send({error_msg:'无效的金额'});
    }
    var uid = req.body.uid;
    var productID = req.body.product;
    User.findById(uid, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(500).send({error_msg:'user not found'});
        }
        if (user.finance.balance < depositAmount) {
            return res.status(403).send({error_msg:'用户余额不足'});
        }
        if (user.wechat.status != 6) {
            return res.status(403).send({error_msg:'用户不处于未入资状态'});
        }
        user.finance.balance -= depositAmount;
        var orderData = {
            userID: user._id,
            userMobile: user.mobile,
            dealType: 9,
            amount: depositAmount,
            status: 1,
            description: '股指拍拍机保证金',
            userBalance: user.finance.balance,
            approvedBy: req.user.mobile,
            approvedAt: Date.now()
        };
        Order.create(orderData, function(err, order) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            var cash = 200000;
            var closeLine = CLOSE_LINE;
            var warnLine = WARN_LINE;
            var trader = user.wechat.real_trader;
            if (productID == 1) {
                cash = 70000;
                closeLine = SILVER_CLOSE_LINE;
                warnLine = SILVER_WARN_LINE;
                trader = user.wechat.real_silverTrader;
            }
            var close = cash - (depositAmount - closeLine);
            var warning = cash - (depositAmount - warnLine);
            var debt = cash - depositAmount;
            mockTrader.User.update({_id:trader}, {$set:{close:close * 100, warning:warning * 100, cash:cash * 100, deposit:depositAmount * 100, debt:debt * 100, lastCash:cash * 100, status:1}}, function(err, numberAffected, raw) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                if (!numberAffected) {
                    return res.status(500).send({error_msg:'无法更新用户'});
                }
                if (productID == 1) {
                    user.wechat.silverStatus = 3;
                } else {
                    user.wechat.status = 3;
                }
                user.save(function(err) {
                    if (err) {
                        return res.status(500).send({error_msg:err.toString()});
                    }
                    var content = '用户(' + user.identity.name + ',' + user.wechat.mobile + ')本金入资已经完成';
                    sms.sendSMS(RISKCONTROL_NUM, null, content);
                    sms.sendSMS(SUPPORT_NUM, null, content);
                    res.send({});
                });
            });
        });
    });
}

function addDeposit(req, res) {
    logger.debug('addDeposit operate by ' + req.user.mobile, req.body);
    var depositAmount = req.body.amount;
    if (!depositAmount || depositAmount <= 0) {
        return res.status(403).send({error_msg:'无效的金额'});
    }
    var uid = req.body.uid;
    var productID = req.body.product;
    User.findById(uid, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(500).send({error_msg:'user not found'});
        }
        if (user.finance.balance < depositAmount) {
            return res.status(403).send({error_msg:'用户余额不足'});
        }
        if (user.wechat.status != 4) {
            return res.status(403).send({error_msg:'用户不处于交易状态'});
        }
        user.finance.balance -= depositAmount;
        var orderData = {
            userID: user._id,
            userMobile: user.mobile,
            dealType: 6,
            amount: depositAmount,
            status: 1,
            description: '股指拍拍机追加保证金',
            userBalance: user.finance.balance,
            approvedBy: req.user.mobile,
            approvedAt: Date.now()
        };
        Order.create(orderData, function(err, order) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            user.save(function(err) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                depositAmount *= 100;
                var trader = user.wechat.real_trader;
                if (productID == 1) {
                    trader = user.wechat.real_silverTrader;
                }
                mockTrader.User.findById(trader, function (err, trader) {
                    if (err) {
                        return res.status(500).send({error_msg:err.toString()});
                    }
                    if (!trader) {
                        return res.status(500).send({error_msg:'无法更新用户'});
                    }
                    logger.info('addDeposit before change', trader);
                    trader.deposit += depositAmount;
                    trader.cash += depositAmount;
                    trader.lastCash += depositAmount;
                    trader.save(function(err) {
                        if (err) {
                            return res.status(500).send({error_msg:err.toString()});
                        }
                        logger.info('addDeposit after change', trader);
                        res.send({});
                    });
                });
            });
        });
    });
}

function getProfit(req, res) {
    logger.debug('getProfit operate by ' + req.user.mobile, req.body);
    var profitAmount = req.body.amount;
    if (!profitAmount || profitAmount <= 0) {
        return res.status(403).send({error_msg:'无效的金额'});
    }
    var uid = req.body.uid;
    User.findById(uid, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(500).send({error_msg:'user not found'});
        }
        if (user.wechat.status != 4) {
            return res.status(403).send({error_msg:'用户不处于交易状态'});
        }
        var orderData = {
            userID: user._id,
            userMobile: user.mobile,
            dealType: 3,
            amount: profitAmount,
            status: 1,
            description: '股指拍拍机盈利提取',
            userBalance: user.finance.balance + profitAmount,
            approvedBy: req.user.mobile,
            approvedAt: Date.now()
        };
        Order.create(orderData, function(err, order) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            profitAmount *= 100;
            mockTrader.User.findById(user.wechat.real_trader, function(err, trader) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                if (!trader) {
                    return res.status(500).send({error_msg:'找不到交易用户'});
                }
                var profit = trader.cash - (trader.deposit + trader.debt);
                if (profitAmount > profit) {
                    return res.status(500).send({error_msg:'无效的盈利金额'});
                }
                trader.cash -= profitAmount;
                trader.lastCash = trader.cash;
                trader.save(function(err) {
                    if (err) {
                        return res.status(500).send({error_msg:err.toString()});
                    }
                    user.finance.balance += profitAmount/100;
                    user.save(function(err) {
                        if (err) {
                            return res.status(500).send({error_msg:err.toString()});
                        }
                        res.send({});
                    });
                })
            });
        });
    });
}

function changeTraderStatus(req, res) {
    logger.info('changeTraderStatus operate by ' + req.user.mobile, req.body);
    var path = 'wechat.status';
    var productID = req.body.product;
    if (productID == 1) {
        path = 'wechat.silverStatus';
    }
    User.findByIdAndUpdate(req.body.uid, {path:req.body.user_status}, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(400).send({error_msg:'用户不存在'});
        }
        if (req.body.user_status === 4) {
            var content = '用户(' + user.identity.name + ',' + user.wechat.mobile + ')交易权限已经开通';
            sms.sendSMS(SUPPORT_NUM, '', content);
        } else if (req.body.user_status === 5) {
            var content = '用户(' + user.identity.name + ',' + user.wechat.mobile + ')刚刚申请了结算，请及时对账和处理';
            sms.sendSMS(RISKCONTROL_NUM, '', content);
        }
        if (req.body.trader_status !== null && req.body.trader_status != undefined) {
            var trader = user.wechat.real_trader;
            if (productID == 1) {
                trader = user.wechat.real_silverTrader;
            }
            mockTrader.User.update({_id:trader}, {status:req.body.trader_status}, function(err, numberAffected, raw) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                if (!numberAffected) {
                    return res.status(400).send({error_msg:'更新失败'});
                }
                res.send({});
            });
        } else {
            res.send({});
        }
    });
}

function finishTrade(req, res) {
    logger.info('finishTrade operate by ' + req.user.mobile, req.body);
    var productID = req.body.product;
    async.waterfall([
        function(callback) {
            User.findById(req.body.uid, function(err, user) {
                if (!err && !user) {
                    err = '用户不存在';
                }
                callback(err, user);
            });
        },
        function(user, callback) {
            var trader = user.wechat.real_trader;
            if (productID == 1) {
                trader = user.wechat.real_silverTrader;
            }
            mockTrader.User.findById(trader, function(err, trader) {
                if (!err && !trader) {
                    err = '交易用户不存在';
                }
                callback(err, trader, user);
            });
        },
        function(trader, user, callback) {
            var profit = parseFloat(req.body.profit);
            var err = null;
            if (profit === null || profit === undefined) {
                err = '无效的盈利金额';
            }
            callback(err, profit, trader, user);
        },
        function(profit, trader, user, callback) {
            if (profit > 0) {
                user.finance.balance += profit;
                var orderData = {
                    userID: user._id,
                    userMobile: user.mobile,
                    dealType: 4,
                    amount: profit,
                    status: 1,
                    description: '股指拍拍机盈利',
                    userBalance: user.finance.balance,
                    approvedBy: req.user.mobile,
                    approvedAt: Date.now()
                };
                Order.create(orderData, function(err, order) {
                    callback(err, profit, trader, user);
                });
            } else {
                callback(null, profit, trader, user);
            }
        },
        function(profit, trader, user, callback) {
            var deposit = trader.deposit/100;
            var balance = profit + deposit;
            if (balance > 0) {
                var amount = balance;
                if (profit > 0) {
                    amount = deposit;
                }
                user.finance.balance += amount;
                var orderData = {
                    userID: user._id,
                    userMobile: user.mobile,
                    dealType: 5,
                    amount: amount,
                    status: 1,
                    description: '股指拍拍机保证金返还',
                    userBalance: user.finance.balance,
                    approvedBy: req.user.mobile,
                    approvedAt: Date.now()
                };
                Order.create(orderData, function(err, order) {
                    callback(err, trader, user);
                });
            } else {
                var orderData = {
                    userID: user._id,
                    userMobile: user.mobile,
                    dealType: 5,
                    amount: 0,
                    status: 1,
                    description: '股指拍拍机保证金返还 用户穿仓',
                    userBalance: user.finance.balance,
                    approvedBy: req.user.mobile,
                    approvedAt: Date.now()
                };
                Order.create(orderData, function(err, order) {
                    callback(err, trader, user);
                });
            }
        },
        function(trader, user, callback) {
            trader.cash = 0;
            trader.lastCash = 0;
            trader.deposit = 0;
            trader.waring = 0;
            trader.close = 0;
            trader.debt = 0;
            trader.status = 1;
            trader.save(function(err) {
                callback(err, user);
            });
        },
        function(user, callback) {
            if (productID == 1) {
                user.wechat.silverStatus = 6;
            } else {
                user.wechat.status = 6;
            }
            user.save(function(err) {
                callback(err, user);
            });
        }
    ], function(err, user) {
        if (err) {
            logger.error('finishOrder err', err);
            return res.status(500).send({error_msg:err.toString()});
        }
        var content = '用户(' + user.identity.name + ',' + user.wechat.mobile + ')风控结算已完成，可以进行提现。';
        sms.sendSMS(FINANCE_NUM1, null, content);
        sms.sendSMS(FINANCE_NUM2, null, content);
        res.send({balance:user.finance.balance});
    });
}

function withdraw(req, res) {
    logger.info('withdraw operate by ' + req.user.mobile, req.body);
    User.findById(req.body.uid, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(400).send({error_msg:'用户不存在'});
        }
        if (user.finance.balance <= 0) {
            return res.status(400).send({error_msg:'用户余额不足'});
        }
        Card.findOne({userID:user._id}, function(err, card) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            if (!card) {
                return res.status(400).send({error_msg:'找不到银行卡'});
            }
            var orderData = {
                userID: user._id,
                userMobile: user.mobile,
                dealType: 2,
                amount: user.finance.balance,
                status: 0,
                description: '股指拍拍机提现',
                userBalance: 0,
                otherInfo: util.generateSerialID(),
                cardInfo: {
                    bank: util.bankNameFromNJBankID[parseInt(card.bankID)],
                    bankName: card.bankName,
                    cardID: card.cardID,
                    userName: card.userName
                }
            };
            logger.error('ppj with draw', orderData);
            Order.create(orderData, function(err, order) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                user.finance.balance = 0;
                user.save(function(err) {
                    if (err) {
                        return res.status(500).send({error_msg:err.toString()});
                    }
                    res.send({});
                });
            });
        });
    });
}

function addCard(req, res) {
    if (!req.body.uid || !req.body.cardID || !req.body.name || !req.body.bankID || !req.body.userMobile) {
        return res.status(403).send({error_msg:'无效的请求'});
    }
    logger.info('addCard operate by ' + req.user.mobile, req.body);
    var card = new Card({
        userID: req.body.uid,
        bankID: req.body.bankID,
        bankName: 'no name',
        cardID: req.body.cardID,
        userName: req.body.name
    });
    card.save(function(err) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        res.send({});
    });
}

function changeTradeSetting(req, res) {
    if (req.body.open === undefined || req.body.open === null) {
        return res.status(403).send({error_msg:'参数无效'});
    }
    var userID = fetchTraderID(req.user, req.body.type, req.body.product);
    if (req.body.win === undefined || req.body.win === null) {
        req.body.win = 0;
    }
    if (req.body.loss === undefined || req.body.loss === null) {
        req.body.loss = 0;
    }
    mockTrader.User.update({_id:userID}, {tradeControl:req.body.open, winPoint:req.body.win, lossPoint:req.body.loss}, function(err, numberAffected, raw) {
        if (err) {
            logger.warn(err);
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!numberAffected) {
            logger.warn('无法更新设置');
            return res.status(503).send({error_msg:'无法更新设置'});
        }
        res.send({});
    });
}

function startCtp(req, res) {
    ctpTrader.initHive(1);
    res.send({});
}

function stopCtp(req, res) {
    ctpTrader.destroyHive(1);
    res.send({});
}

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/api/futures/user_rank', passportConf.isWechatAuthenticated, fetchUserRankData);

        app.post('/api/futures/create_order', passportConf.isWechatAuthenticated, placeOrder);

        app.get('/api/futures/get_positions', passportConf.isWechatAuthenticated, getPositions);

        app.get('/api/futures/get_orders', passportConf.isWechatAuthenticated, util.page(getOrderCount, 15), getOrders);

        app.get('/futures/get_nearest_orders', passportConf.isWechatAuthenticated, getNearestOrders);

        app.get('/api/futures/get_user_profit', passportConf.isWechatAuthenticated, getUserProfit);

        app.get('/api/futures/user_info', getUserInfo);

        app.get('/futures', passportConf.isWechatAuthenticated, home);

        app.get('/futures/reset_user', resetUser);

        app.post('/futures/make_appointment', passportConf.isWechatAuthenticated, makeAppointment);

        app.get('/futures/approve_user', passportConf.requiresRole('admin'), approveUser);

        app.post('/futures/add_money', passportConf.requiresRole('admin'), addMoney);

        app.get('/futures/create_account', passportConf.requiresRole('admin'), createAccount);

        app.post('/futures/change_user_access', passportConf.requiresRole('admin'), changeTraderStatus);

        app.post('/futures/trade_close', passportConf.isWechatAuthenticated, changeTraderStatus);

        app.post('/futures/finish_trade', passportConf.requiresRole('admin'), finishTrade);

        app.post('/futures/withdraw', passportConf.requiresRole('admin'), withdraw);

        app.post('/futures/addCard', passportConf.requiresRole('admin'), addCard);

        app.post('/futures/add_deposit', passportConf.requiresRole('admin'), addDeposit);

        app.post('/futures/get_profit', passportConf.requiresRole('admin'), getProfit);

        app.get('/futures/real', passportConf.isWechatAuthenticated, realHome);

        app.get('/futures/start_ctp', passportConf.requiresRole('admin'), startCtp);

        app.get('/futures/stop_ctp', passportConf.requiresRole('admin'), stopCtp);

        app.post('/futures/change_trade_setting', passportConf.isWechatAuthenticated, changeTradeSetting);

        app.get('/futures/test', test);

        app.get('/futures/*', function(req, res, next) {
            var now = moment();

            var startTime = moment();
            startTime.hour(09);
            startTime.minute(00);
            startTime.second(00);

            var midTime1 = moment();
            midTime1.hour(11);
            midTime1.minute(29);
            midTime1.second(59);

            var midTime2 = moment();
            midTime2.hour(13);
            midTime2.minute(30);
            midTime2.second(00);

            var midTime3 = moment();
            midTime3.hour(14);
            midTime3.minute(57);
            midTime3.second(00);

            var midTime4 = moment();
            midTime4.hour(21);
            midTime4.minute(00);
            midTime4.second(00);

            var firstTime = moment().startOf('day');
            firstTime.add(2.5, 'hours');

            var tradeTime = true;
            if (util.isHoliday(now.dayOfYear())) {
                tradeTime = false;
            } else if (now > firstTime && now < startTime) {
                tradeTime = false;
            } else if (now > midTime1 && now < midTime2) {
                tradeTime = false;
            } else if (now > midTime3 && now < midTime4) {
                tradeTime = false;
            }

            res.render('futures/' + req.params[0], {
                layout:null,
                tradeTime: true
            });
        });
    },
    collectStatisticData: function(cb) {
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
        ], function(err, data) {
            if (err) {
                return cb(err);
            }
            cb(null, data);
        });
    }
};
