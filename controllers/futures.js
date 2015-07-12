var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    PayInfo = require('../models/PayInfo'),
    DailyData = require('../models/DailyData'),
    applies = require('../controllers/apply'),
    yeepay = require('../lib/yeepay'),
    util = require('../lib/util'),
    useragent = require('useragent'),
    _ = require('lodash'),
    moment = require('moment'),
    async = require('async'),
    log4js = require('log4js'),
    logger = log4js.getLogger('mobile');

function home(req, res, next) {
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
    query.sort('-wechat.profit').limit(8).select('wechat');
    query.exec(function(err, users) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        var userInRank = false;
        /*
        for (var i = 0; i < users.length; ++i) {
            if (users[i].wechat.wechat_uuid == req.user.wechat.wechat_uuid) {
                userInRank = true;
                break;
            }
        }
        */
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

        app.get('/futures', passportConf.isWechatAuthenticated, home);

        app.get('/futures/*', function(req, res, next) {
            var startTime = moment('2015-07-10');
            startTime.hour(09);
            startTime.minute(15);
            startTime.second(00);

            var endTime = moment('2015-07-10');
            endTime.hour(15);
            endTime.minute(15);
            endTime.second(00);

            var now = moment('2015-07-10 10:20:00');

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