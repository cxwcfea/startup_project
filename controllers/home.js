var User = require('../models/User'),
    Apply = require('../models/Apply'),
    DailyData = require('../models/DailyData'),
    util = require('../lib/util'),
    useragent = require('useragent'),
    log4js = require('log4js'),
    logger = log4js.getLogger('home');

function home(req, res, next) {
    var ua = req.headers['user-agent'];
    if (util.isAndroid(ua) || util.isApple(ua)) {
        res.redirect('/mobile');
        return;
    }
    if (!req.session.statistic || req.session.statistic.expires < Date.now()) {
        User.aggregate([{$match:{registered:true}}, {$group: {_id: null, count: {$sum: 1}, profit: { $sum: '$finance.profit'}, capital: { $sum: '$finance.history_capital' }, current_capital: { $sum: '$finance.total_capital' }}}], function(err, statistic) {
            if (err || !statistic || statistic.length === 0) {
                logger.warn('error when fetch total user count:' + err.toString());
                statistic = [{
                    count: 7000,
                    capital: 200000000,
                    profit: 4000000
                }];
            }
            DailyData.find({}, function(err, dailyData) {
                if (err) {
                    logger.warn('error when fetch daily data:' + err.toString());
                    statistic[0].dailyAmount = 10000000;
                } else {
                    var amount = 0;
                    for (var i = 0; i < dailyData.length; ++i) {
                        amount += dailyData[i].applyAmount;
                    }
                    statistic[0].dailyAmount = amount;
                }
                Apply
                    .find({})
                    .sort({ _id: -1 })
                    .limit(8)
                    .exec(function(err, applies) {
                        var theApplies;
                        if (!applies) {
                            theApplies = [
                                {
                                    userMobile: '134******20',
                                    amount: 50000
                                },
                                {
                                    userMobile: '131******06',
                                    amount: 100000
                                },
                                {
                                    userMobile: '138******19',
                                    amount: 200000
                                },
                                {
                                    userMobile: '159******65',
                                    amount: 2000
                                },
                                {
                                    userMobile: '138******65',
                                    amount: 23000
                                },
                                {
                                    userMobile: '139******35',
                                    amount: 62000
                                },
                                {
                                    userMobile: '137******68',
                                    amount: 7800
                                },
                                {
                                    userMobile: '135******14',
                                    amount: 250000
                                }
                            ];
                        } else {
                            theApplies = applies.map(function(a) {
                                return {
                                    userMobile: util.mobileDisplay(a.userMobile),
                                    amount: a.amount
                                }
                            });
                        }
                        req.session.statistic = {
                            user_count: statistic[0].count + 7000,
                            total_capital: statistic[0].capital + 200000000 + statistic[0].dailyAmount + statistic[0].current_capital,
                            total_profit: (statistic[0].profit + 4000000).toFixed(0),
                            show_applies: theApplies,
                            expires: Date.now() + 3600000 * 1
                        };

                        res.locals.main_menu = true;
                        res.render('home', {
                            user_count: req.session.statistic.user_count,
                            total_capital: util.formatDisplayNum(req.session.statistic.total_capital),
                            total_profit: req.session.statistic.total_profit,
                            apply_infos: req.session.statistic.show_applies
                        });
                    });
            });
        });
    } else {
        res.locals.main_menu = true;
        res.render('home', {
            user_count: req.session.statistic.user_count,
            total_capital: util.formatDisplayNum(req.session.statistic.total_capital),
            total_profit: req.session.statistic.total_profit,
            apply_infos: req.session.statistic.show_applies
        });
    }
}

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/', home);
    }
};
