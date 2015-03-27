var User = require('../models/User'),
    log4js = require('log4js'),
    logger = log4js.getLogger('admin');

function home(req, res, next) {
    if (!req.session.statistic || req.session.statistic.expires < Date.now()) {
        User.aggregate([{$match:{registered:true}}, {$group: {_id: null, count: {$sum: 1}, profit: { $sum: '$finance.profit'}, capital: { $sum: '$finance.total_capital' } }}], function(err, statistic) {
            if (err || !statistic) {
                logger.warn('error when fetch total user count:' + err.toString());
                statistic = [{
                    count: 100,
                    capital: 100000,
                    profit: 10000
                }];
            }
            req.session.statistic = {
                user_count: statistic[0].count,
                total_capital: statistic[0].capital,
                total_profit: statistic[0].profit,
                expires: Date.now() + 3600000 * 12
            };
        });
    }
    console.log('cxwcfea');
    res.locals.main_menu = true;
    res.render('home', {
        user_count: req.session.statistic.user_count,
        total_capital: req.session.statistic.total_capital,
        total_profit: req.session.statistic.total_profit
    });
}

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/', home);
    }
};