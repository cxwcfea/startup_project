var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    PayInfo = require('../models/PayInfo'),
    Card = require('../models/Card'),
    DailyData = require('../models/DailyData'),
    applies = require('../controllers/apply'),
    yeepay = require('../lib/yeepay'),
    util = require('../lib/util'),
    mockTrader = require('./mockTrader'),
    ctpTrader = require('./ctpTrader'),
    useragent = require('useragent'),
    _ = require('lodash'),
    moment = require('moment'),
    async = require('async'),
    log4js = require('log4js'),
    logger = log4js.getLogger('futures');

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
    var query = User.find({});
    query.exists('wechat.wechat_uuid');
    query.populate('wechat.trader');
    query.select('wechat identity');
    query.exec(function(err, users) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        users.sort(function(x, y) {
            return y.wechat.trader.lastCash - x.wechat.trader.lastCash;
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
    var quantity = req.body.quantity;
    var forceClose = req.body.forceClose;

    req.body.contract = {exchange:'future', stock_code:'IFCURR'};
    if (forceClose) {
        req.body.force_close = 1;
        if (req.body.type == 1 && req.user.wechat.status === 4) {
            req.body.user_id = req.user.wechat.real_trader;
            ctpTrader.riskControl(req, res);
        } else {
            req.body.user_id = req.user.wechat.trader;
            mockTrader.riskControl(req, res);
        }
    } else {
        var obj = {
            order: {
                quantity: quantity,
                contract: {
                    stock_code: 'IFCURR',
                    exchange: 'future'
                }
            }
        };

        switch (parseInt(req.body.product)) {
            case 0: // IF
                obj.order.contract = {exchange:'future', stock_code:'IFCURR'};
                break;
            case 1: // EURUSD
                obj.order.contract = {exchange:'forex', stock_code:'EURUSD'};
                break;
            case 2: // XAUUSD
                obj.order.contract = {exchange:'commodity', stock_code:'XAUUSD'};
                break;
            case 3: // BABA
                obj.order.contract = {exchange:'stock', stock_code:'BABA'};
                break;
            default :
                obj.order.contract = {exchange:'future', stock_code:'IFCURR'};
        }

        if (req.body.type == 1 && req.user.wechat.status === 4) {
            obj.user_id = req.user.wechat.real_trader;
            ctpTrader.createOrder(obj, function(err, order) {
                if (err) {
                    var msg = getErrorMessage(err);
                    return res.status(500).send({error_msg:msg});
                }
                res.send(order);
            });
        } else {
            obj.user_id = req.user.wechat.trader;
            mockTrader.createOrder(obj, function(err, order) {
                if (err) {
                    var msg = getErrorMessage(err);
                    return res.status(500).send({error_msg:msg});
                }
                res.send(order);
            });
        }
    }
}

function getPositions(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    if (req.query.type == 1 && req.user.wechat.real_trader) {
        ctpTrader.getPositions({user_id:req.user.wechat.real_trader}, function(err, positions) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            ctpTrader.getUserInfo({user_id:req.user.wechat.real_trader}, function(err, user) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                res.send({position:positions[0], user:user});
            });
        });
    } else {
        mockTrader.getPositions({user_id:req.user.wechat.trader}, function(err, positions) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            mockTrader.getUserInfo({user_id:req.user.wechat.trader}, function(err, user) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                res.send({position:positions[0], user:user});
            });
        });
    }
}

function getOrders(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    var page = req.page;
    req.body.date_begin = 0;
    req.body.date_end = Date.now();
    req.body.page = page;
    if (req.query.type == 1 && req.user.wechat.real_trader) {
        req.body.user_id = req.user.wechat.real_trader;
        ctpTrader.getHistoryOrders(req, res);
    } else {
        req.body.user_id = req.user.wechat.trader;
        mockTrader.getHistoryOrders(req, res);
    }
}

function getUserProfit(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    switch (req.query.product) {
        case '0': // IF
            req.body.contract = {exchange:'future', stock_code:'IFCURR'};
            break;
        case '1': // EURUSD
            req.body.contract = {exchange:'forex', stock_code:'EURUSD'};
            break;
        case '2': // XAUUSD
            req.body.contract = {exchange:'commodity', stock_code:'XAUUSD'};
            break;
        case '3': // BABA
            req.body.contract = {exchange:'stock', stock_code:'BABA'};
            break;
        default :
            req.body.contract = {exchange:'future', stock_code:'IFCURR'};
    }
    if (req.query.type == 1 && req.user.wechat.real_trader) {
        req.body.user_id = req.user.wechat.real_trader;
        ctpTrader.getProfit(req, res);
    } else {
        req.body.user_id = req.user.wechat.trader;
        mockTrader.getProfit(req, res);
    }
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
    if (req.query.type == 1 && req.user.wechat.real_trader) {
        ctpTrader.getUserInfo({user_id:req.user.wechat.real_trader}, function(err, user) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            if (!user) {
                return res.status(500).send({error_msg:'user not found'});
            }
            res.send(user);
        });
    } else {
        mockTrader.getUserInfo({user_id:req.user.wechat.trader}, function(err, user) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            res.send(user);
        });
    }
}

function resetUser(req, res) {
    mockTrader.resetUser(req.user.wechat.trader, function(err) {
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
        res.send({});
    });
}

function approveUser(req, res) {
    logger.info('approveUser operate by ' + req.user.mobile, req.query);
    var uid = req.query.uid;
    User.update({_id:uid}, {'wechat.appointment':false, 'wechat.access_real':true, 'wechat.status':1}, function(err, numberAffected, raw) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!numberAffected) {
            return res.status(500).send({error_msg:'无法更新用户'});
        }
        res.send({});
    });
}

function createAccount(req, res) {
    logger.debug('addMoney operate by ', req.query);
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
            user.wechat.appointment = false;
            user.wechat.real_trader = trader;
            user.wechat.status = 3;
            user.save(function(err) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                res.send({});
            });
        });
    });
}

function addMoney(req, res) {
    logger.debug('addMoney operate by ', req.query);
    var DepositAmount = 30000;
    var uid = req.query.uid;
    User.findById(uid, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(500).send({error_msg:'user not found'});
        }
        if (user.finance.balance < DepositAmount) {
            return res.status(403).send({error_msg:'用户余额不足'});
        }
        user.finance.balance -= DepositAmount;
        var orderData = {
            userID: user._id,
            userMobile: user.mobile,
            dealType: 9,
            amount: DepositAmount,
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
            if (!user.wechat.real_trader) {
                mockTrader.createUser({
                    name: user.wechat.wechat_uuid,
                    warning: 18000000,
                    close: 17500000,
                    cash: 20000000,
                    deposit: DepositAmount * 100,
                    debt: 17000000,
                    status: 1,
                    real: true
                }, function(err, trader) {
                    if (err) {
                        return res.status(500).send({error_msg:err.toString()});
                    }
                    if (!trader) {
                        return res.status(500).send({error_msg:'can not create trader'});
                    }
                    user.wechat.appointment = false;
                    user.wechat.real_trader = trader;
                    user.wechat.status = 3;
                    user.save(function(err) {
                        if (err) {
                            return res.status(500).send({error_msg:err.toString()});
                        }
                        res.send({});
                    });
                });
            } else {
                mockTrader.User.update({_id:user.wechat.real_trader}, {$set:{close:17500000, warning:18000000, cash:20000000, deposit:3000000, debt:17000000, lastCash:0, status:1}}, function(err, numberAffected, raw) {
                    if (err) {
                        return res.status(500).send({error_msg:err.toString()});
                    }
                    if (!numberAffected) {
                        return res.status(500).send({error_msg:'无法更新用户'});
                    }
                    user.wechat.appointment = false;
                    user.wechat.status = 3;
                    user.save(function(err) {
                        if (err) {
                            return res.status(500).send({error_msg:err.toString()});
                        }
                        res.send({});
                    });
                });
            }
        });
    });
}

function changeTraderStatus(req, res) {
    logger.info('changeTraderStatus operate by ' + req.user.mobile, req.body);
    User.findByIdAndUpdate(req.body.uid, {'wechat.status':req.body.user_status}, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        if (!user) {
            return res.status(400).send({error_msg:'用户不存在'});
        }
        if (req.body.trader_status !== null && req.body.trader_status != undefined) {
            mockTrader.User.update({_id:user.wechat.real_trader}, {status:req.body.trader_status}, function(err, numberAffected, raw) {
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
            mockTrader.User.findById(user.wechat.real_trader, function(err, trader) {
                if (!err && !trader) {
                    err = '交易用户不存在';
                }
                callback(err, trader, user);
            });
        },
        function(trader, user, callback) {
            var profit = parseFloat(req.body.profit);
            var err = null;
            if (!profit) {
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
                callback(err, trader, user);
            }
        },
        function(trader, user, callback) {
            trader.cash = 0;
            trader.lastCash = 0;
            trader.deposit = 0;
            trader.status = 1;
            trader.save(function(err) {
                callback(err, user);
            });
        },
        function(user, callback) {
            user.wechat.status = 3;
            user.save(function(err) {
                callback(err, user);
            });
        }
    ], function(err, user) {
        if (err) {
            logger.error('finishOrder err', err);
            return res.status(500).send({error_msg:err.toString()});
        }
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
    var userID = req.user.wechat.trader;
    if (req.body.type == 1) {
        userID = req.user.wechat.real_trader;
    }
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
        ctpTrader.loadDBData();
        res.send({});
    });
}

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/api/futures/user_rank', passportConf.isWechatAuthenticated, fetchUserRankData);

        app.post('/api/futures/create_order', passportConf.isWechatAuthenticated, placeOrder);

        app.get('/api/futures/get_positions', passportConf.isWechatAuthenticated, getPositions);

        app.get('/api/futures/get_orders', passportConf.isWechatAuthenticated, util.page(getOrderCount, 15), getOrders);

        app.get('/api/futures/get_user_profit', passportConf.isWechatAuthenticated, getUserProfit);

        app.get('/api/futures/user_info', getUserInfo);

        app.get('/futures', passportConf.isWechatAuthenticated, home);

        app.get('/futures/reset_user', resetUser);

        app.post('/futures/make_appointment', passportConf.isWechatAuthenticated, makeAppointment);

        app.get('/futures/approve_user', passportConf.requiresRole('admin'), approveUser);

        app.get('/futures/add_money', passportConf.requiresRole('admin'), addMoney);

        app.get('/futures/create_account', passportConf.requiresRole('admin'), createAccount);

        app.post('/futures/change_user_access', passportConf.requiresRole('admin'), changeTraderStatus);

        app.post('/futures/trade_close', passportConf.isWechatAuthenticated, changeTraderStatus);

        app.post('/futures/finish_trade', passportConf.requiresRole('admin'), finishTrade);

        app.post('/futures/withdraw', passportConf.requiresRole('admin'), withdraw);

        app.post('/futures/addCard', passportConf.requiresRole('admin'), addCard);

        app.get('/futures/real', passportConf.isWechatAuthenticated, realHome);

        app.post('/futures/change_trade_setting', passportConf.isWechatAuthenticated, changeTradeSetting);

        app.get('/futures/test', test);

        app.get('/futures/*', function(req, res, next) {
            var startTime = moment();
            startTime.hour(09);
            startTime.minute(15);
            startTime.second(00);

            var endTime = moment();
            endTime.hour(15);
            endTime.minute(12);
            endTime.second(00);

            var now = moment();

            var midTime1 = moment();
            midTime1.hour(11);
            midTime1.minute(30);
            midTime1.second(01);

            var midTime2 = moment();
            midTime2.hour(13);
            midTime2.minute(00);
            midTime2.second(00);

            var tradeTime = true;
            if (util.isHoliday(now.dayOfYear())) {
                tradeTime = false;
            } else if (now < startTime || now > endTime) {
                tradeTime = false;
            } else if (now > midTime1 && now < midTime2) {
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
