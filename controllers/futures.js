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

function home(req, res, next) {
    logger.debug('access home');
    if (req.user) {
        util.getUserViewModel(req.user, function(user) {
            delete user.wechat.wechat_uuid;
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
    query.sort({'wechat.trader.cash':1}).limit(8).select('wechat');
    query.exec(function(err, users) {
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
        console.log(users);
        res.send({users:users, userInRank:userInRank});
    });
}

function placeOrder(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    var quantity = req.body.quantity;
    var forceClose = req.body.force_close;
    if (forceClose) {
        req.body.user_id = req.user.wechat.trader;
        req.body.force_close = 1;
        mockTrader.riskControl(req, res);
    } else {
        var obj = {
            order: {
                quantity: quantity,
                contract: {
                    stock_code: mockTrader.getStockCode(),
                    exchange: 'future'
                }
            },
            user_id: req.user.wechat.trader
        };
        mockTrader.createOrder(obj, function(err, order) {
            if (err) {
                return res.status(500).send({error_msg:err.toString()});
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
            console.log(user);
            res.send({position:positions[0], user:user});
        });
    });
}

function getOrders(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    req.body.user_id = req.user.wechat.trader;
    req.body.date_begin = 0;
    req.body.date_end = Date.now();
    mockTrader.getHistoryOrders(req, res);
}

function getUserProfit(req, res) {
    if (!req.user || !req.user.wechat || !req.user.wechat.wechat_uuid) {
        return res.status(403).send({error_msg:'user need log in'});
    }
    req.body.user_id = req.user.wechat.trader;
    mockTrader.getProfit(req, res);
}

function test(req, res) {
    var query = User.find({});
    query.exists('wechat.wechat_uuid');
    query.populate('wechat.trader');
    query.sort('-wechat.trader.cash').limit(8).select('wechat');
    query.exec(function(err, users) {
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

module.exports = {
    registerRoutes: function(app, passportConf) {
        /*
        app.get('/futures', function(req, res, next) {
            res.render('futures/index', {
                layout:null
            });
        });
         */
        app.get('/api/futures/user_rank', fetchUserRankData);

        app.post('/api/futures/create_order', placeOrder);

        app.get('/api/futures/get_positions', getPositions);

        app.get('/api/futures/get_orders', getOrders);

        app.get('/api/futures/get_user_profit', getUserProfit);

        app.get('/futures', passportConf.isWechatAuthenticated, home);

        app.get('/futures/test', test);

        app.get('/futures/*', function(req, res, next) {
            //var startTime = moment('2015-07-10');
            var startTime = moment();
            startTime.hour(09);
            startTime.minute(15);
            startTime.second(00);

            //var endTime = moment('2015-07-10');
            var endTime = moment();
            endTime.hour(15);
            endTime.minute(15);
            endTime.second(00);

            //var now = moment('2015-07-10 10:20:00');
            var now = moment();

            var tradeTime = true;
            if (util.isHoliday(now.dayOfYear())) {
                tradeTime = false;
            } else if (now < startTime || now > endTime) {
                tradeTime = false;
            }

            res.render('futures/' + req.params[0], {
                layout:null,
                tradeTime: tradeTime
            });
        });
    }
};