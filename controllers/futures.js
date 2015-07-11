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
    async = require('async'),
    log4js = require('log4js'),
    logger = log4js.getLogger('mobile');

function home(req, res, next) {
    util.getUserViewModel(req.user, function(user) {
        delete req.user.wechat.wechat_uuid;
        console.log(user);
        res.render('futures/index', {
            layout:null,
            bootstrappedUserObject: JSON.stringify(user)
        });
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
        app.get('/futures', passportConf.isWechatAuthenticated, home);

        app.get('/futures/*', function(req, res, next) {
            res.render('futures/' + req.params[0], {layout:null});
        });
    }
};