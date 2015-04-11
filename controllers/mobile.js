var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    applies = require('../controllers/apply'),
    util = require('../lib/util'),
    useragent = require('useragent'),
    _ = require('lodash'),
    log4js = require('log4js'),
    logger = log4js.getLogger('mobile');

function home(req, res, next) {
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

                    res.render('mobile/home', {
                        layout: null,
                        user_count: req.session.statistic.user_count,
                        total_capital: req.session.statistic.total_capital.toFixed(0),
                        total_profit: req.session.statistic.total_profit.toFixed(0),
                        apply_infos: req.session.statistic.show_applies
                    });
                });
        });
    } else {
        res.render('mobile/home', {
            layout: null,
            user_count: req.session.statistic.user_count,
            total_capital: req.session.statistic.total_capital.toFixed(0),
            total_profit: req.session.statistic.total_profit,
            apply_infos: req.session.statistic.show_applies
        });
    }
}

function getLogin(req, res, next) {
    res.render('mobile/login', {layout:null});
}

function getSignup(req, res, next) {
    res.render('mobile/signup', {layout:null});
}

function getTTN(req, res, next) {
    res.render('mobile/ttn', {layout:null});
}

function getYYN(req, res, next) {
    res.render('mobile/yyn', {layout:null});
}

function getForget(req, res, next) {
    res.render('mobile/forget', {layout:null});
}

function getUser(req, res, next) {
    res.render('mobile/user', {
        layout:null
    });
}

function getAccount(req, res, next) {
    res.render('mobile/account', {
        layout:null
    });
}

function getRechargeBank(req, res, next) {
    res.render('mobile/recharge_bank', {
        layout:null
    })
}

function getRechargeRecord(req, res, next) {
    res.render('mobile/recharge_record', {
        layout:null
    })
}

function getDownload(req, res, next) {
    var ua = useragent.is(req.headers['user-agent']);
    res.locals.otherPlatform = true;
    if (ua.android) {
        res.locals.android = true;
        res.locals.otherPlatform = false;
    }
    if (ua.mobile_safari) {
        res.locals.ios = true;
        res.locals.otherPlatform = false;
    }
    res.render('mobile/download', {
        layout:null
    })
}

function getChangePass(req, res, next) {
    res.render('mobile/change_password', {
        layout:null
    })
}

function getRechargeAlipay(req, res, next) {
    var order_id = req.query.order_id;
    console.log(req.query);
    if (!order_id) {
        res.render('mobile/recharge_alipay', {
            layout:null
        });
    } else {
        Order.findById(order_id, function(err, order) {
            if (err || !order) {
                logger.warn('mobile getRecharge err:' + err.toString());
            }
            res.render('mobile/recharge_alipay', {
                layout:null,
                bootstrappedOrderObject: JSON.stringify(order)
            });
        });
    }
}

function getUserTtn(req, res, next) {
    res.render('mobile/user_ttn', {
        layout:null
    })
}

function getTtnInfo(req, res, next) {
    Apply.findOne({serialID:req.params.apply_serial_id}, function(err, apply) {
        if (err || !apply) {
            next();
        }
        res.render('mobile/user_ttn_info', {
            layout:null,
            bootstrappedApplyObject: JSON.stringify(apply)
        });
    });
}

function getTTNConfirm(req, res, next) {
    Apply.findOne({serialID:req.params.apply_serial_id}, function(err, apply) {
        if (err || !apply) {
            return next();
        }
        if (req.user._id != apply.userID) {
            res.status(406);
            logger.warn('error when get ttn confirm: not the same user who create the apply');
            return next();
        }
        User.findById(apply.userID, function(err, user) {
            if (err) {
                logger.warn('error when get ttn confirm:' + err.toString());
                return next();
            }
            var applyData = apply._doc;
            var applyVM = _.extend(applyData, {
                userBalance: user.finance.balance
            });
            res.render('mobile/ttn_confirm', {
                layout:null,
                bootstrappedApply: JSON.stringify(applyVM)
            });
        });
    });
}

function getYYNConfirm(req, res, next) {
    Apply.findOne({serialID:req.params.apply_serial_id}, function(err, apply) {
        if (err || !apply) {
            return next();
        }
        if (req.user._id != apply.userID) {
            res.status(406);
            logger.warn('error when get yyn confirm: not the same user who create the apply');
            return next();
        }
        User.findById(apply.userID, function(err, user) {
            if (err) {
                logger.warn('error when get yyn confirm:' + err.toString());
                return next();
            }
            var applyData = apply._doc;
            var applyVM = _.extend(applyData, {
                userBalance: user.finance.balance
            });
            res.render('mobile/yyn_confirm', {
                layout:null,
                bootstrappedApply: JSON.stringify(applyVM)
            });
        });
    });
}

function getAlipayOrderListForCurrentUser(req, res) {
    Order.find({$and: [{payType: 3},  {userID: req.user._id}]}, function(err, orders) {
        if (err) {
            logger.warn('getAlipayOrderListForCurrentUser error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send(orders);
    });
}

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/mobile', function(req, res, next) {
            res.render('mobile/index', {
                layout:'mobile',
                bootstrappedUserObject: req.user ? JSON.stringify(util.getUserViewModel(req.user)) : null
            });
        });

        app.get('/mobile/home', home);

        app.get('/mobile/login', getLogin);

        app.get('/mobile/signup', getSignup);

        app.get('/mobile/ttn', getTTN);

        app.get('/mobile/yyn', getYYN);

        app.get('/mobile/ttn_confirm/:apply_serial_id', passportConf.isAuthenticated, getTTNConfirm);

        app.get('/mobile/yyn_confirm/:apply_serial_id', passportConf.isAuthenticated, getYYNConfirm);

        app.get('/mobile/user', getUser);

        app.get('/mobile/account', getAccount);

        app.get('/mobile/recharge_bank', getRechargeBank);

        app.get('/mobile/recharge_alipay', getRechargeAlipay);

        app.get('/mobile/recharge_record', getRechargeRecord);

        app.get('/mobile/user_ttn', getUserTtn);

        app.get('/mobile/change_password', getChangePass);

        app.get('/mobile/download', getDownload);

        app.get('/mobile/user_ttn_info/:apply_serial_id', getTtnInfo);

        app.get('/mobile/apply/pay_success', passportConf.isAuthenticated, applies.paySuccess);

        app.get('/mobile/exp', function(req, res, next) {
            res.render('mobile/exp', {
                layout: null
            })
        });

        app.get('/mobile/recharge', function(req, res, next) {
            res.render('mobile/recharge', {
                layout: null
            })
        });

        app.get('/mobile/forget', getForget);

        app.get('/mobile/free_apply_confirm', passportConf.isAuthenticated, applies.freeApply);

        app.get('/api/alipay/orders', passportConf.isAuthenticated, getAlipayOrderListForCurrentUser);
    }
};