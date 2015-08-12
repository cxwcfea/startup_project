var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    PayInfo = require('../models/PayInfo'),
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
	redEnvelope = require('../lib/redEnvelopes'),
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
    logger.debug('access home');
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

function fetchUserRankData(req, res) {
    var query = User.find({});
    query.exists('wechat.wechat_uuid');
    query.populate('wechat.trader');
    query.sort({'wechat.trader.cash':1}).select('wechat identity');
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

    if (forceClose) {
        req.body.force_close = 1;
        if (req.body.type == 1 && req.user.wechat.status === 2) {
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

        if (req.body.type == 1 && req.user.wechat.status === 2) {
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
    if (req.query.type == 1 && req.user.wechat.status === 2) {
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
    if (req.query.type == 1 && req.user.wechat.status === 2) {
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
    if (req.query.type == 1 && req.user.wechat.status === 2) {
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
    if (req.query.type == 1 && req.user.wechat.status === 2) {
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
    if (req.user.wechat.status === 2) {
        return res.status(401).send({error_msg:'user not allow reset'});
    }
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
    console.log('approveUser ' + req.body);
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
            warning: 18000000,
            close: 17500000,
            cash: 20000000,
            deposit: 3000000,
            debt: 17000000
        }, function(err, trader) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
            }
            if (!trader) {
                return res.status(500).send({error_msg:'can not create trader'});
            }
            user.wechat.appointment = false;
            user.wechat.access_real = true;
            user.wechat.real_trader = trader;
            user.wechat.status = 2;
            user.save(function(err) {
                if (err) {
                    return res.status(500).send({error_msg:err.toString()});
                }
                res.send({});
            });
        });
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

        app.get('/futures/test', test);

        app.get('/futures/*', function(req, res, next) {
            var startTime = moment();
            startTime.hour(09);
            startTime.minute(15);
            startTime.second(00);

            var endTime = moment();
            endTime.hour(15);
            endTime.minute(15);
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
                var Capital = 15000000;
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
