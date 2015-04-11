var User = require('../models/User'),
    Apply = require('../models/Apply'),
    util = require('../lib/util'),
    useragent = require('useragent'),
    log4js = require('log4js'),
    logger = log4js.getLogger('home');

function home(req, res, next) {
    var ua = useragent.is(req.headers['user-agent']);
    if (ua.android || ua.mobile_safari) {
        res.redirect('/mobile');
        return;
    }
    if (!req.session.statistic || req.session.statistic.expires < Date.now()) {
        User.aggregate([{$match:{registered:true}}, {$group: {_id: null, count: {$sum: 1}, profit: { $sum: '$finance.profit'}, capital: { $sum: '$finance.history_capital' } }}], function(err, statistic) {
            if (err || !statistic) {
                logger.warn('error when fetch total user count:' + err.toString());
                statistic = [{
                    count: 100,
                    capital: 100000,
                    profit: 10000
                }];
            }
            Apply
                .find({})
                .sort({ _id: -1 })
                .limit(5)
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
                        user_count: statistic[0].count,
                        total_capital: statistic[0].capital + statistic[0].profit * 2,
                        total_profit: statistic[0].profit,
                        show_applies: theApplies,
                        expires: Date.now() + 3600000 * 1
                    };

                    res.locals.main_menu = true;
                    res.render('home', {
                        user_count: req.session.statistic.user_count,
                        total_capital: req.session.statistic.total_capital.toFixed(0),
                        total_profit: req.session.statistic.total_profit,
                        apply_infos: req.session.statistic.show_applies
                    });
                });
        });
    } else {
        res.locals.main_menu = true;
        res.render('home', {
            user_count: req.session.statistic.user_count,
            total_capital: req.session.statistic.total_capital.toFixed(0),
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