var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    PayInfo = require('../models/PayInfo'),
    DailyData = require('../models/DailyData'),
    applies = require('../controllers/apply'),
    yeepay = require('../lib/yeepay'),
    util = require('../lib/util'),
    mockTrader = require('./mockTrader'),
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
    'identity',
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
    query.sort({'wechat.trader.cash':1}).select('wechat');
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

function placeOrder(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    var quantity = req.body.quantity;
    var forceClose = req.body.forceClose;

    if (forceClose) {
        req.body.user_id = req.user.wechat.trader;
        req.body.force_close = 1;
        mockTrader.riskControl(req, res);
    } else {
        var obj = {
            order: {
                quantity: quantity,
                contract: {
                    stock_code: 'IFCURR',
                    exchange: 'future'
                }
            },
            user_id: req.user.wechat.trader
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

        mockTrader.createOrder(obj, function(err, order) {
            if (err) {
                var msg;
                switch (err.code) {
                    case 1:
                        msg = '无效的购买数量';
                        break;
                    case 3:
                        msg = '账户已被冻结';
                        break;
                    case 5:
                        msg = '账户余额不足';
                        break;
                    default:
                        msg = '内部错误';
                        break;
                }
                return res.status(500).send({error_msg:msg});
            }
            res.send(order);
        });
    }
}

function getPositions(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
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

function getOrders(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    var page = req.page;
    req.body.user_id = req.user.wechat.trader;
    req.body.date_begin = 0;
    req.body.date_end = Date.now();
    req.body.page = page;
    mockTrader.getHistoryOrders(req, res);
}

function getUserProfit(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    req.body.user_id = req.user.wechat.trader;
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
    mockTrader.getUserInfo({user_id:req.user.wechat.trader}, function(err, user) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        res.send(user);
    });
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
    if (!req.body.mobile) {
        return res.status(400).send({error_msg:'无效的手机号'});
    }
    req.user.mobile = req.body.mobile;
    req.user.wechat.appointment = true;
    req.user.save(function(err) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        res.send({});
    });
}

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/api/futures/user_rank', fetchUserRankData);

        app.post('/api/futures/create_order', placeOrder);

        app.get('/api/futures/get_positions', getPositions);

        app.get('/api/futures/get_orders', util.page(getOrderCount, 15), getOrders);

        app.get('/api/futures/get_user_profit', getUserProfit);

        app.get('/api/futures/user_info', getUserInfo);

        app.get('/futures', passportConf.isWechatAuthenticated, home);

        app.get('/futures/reset_user', resetUser);

        app.post('/futures/make_appointment', passportConf.isWechatAuthenticated, makeAppointment);

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
				tradeTime:true
                //tradeTime: tradeTime
            });
        });
    }
};
