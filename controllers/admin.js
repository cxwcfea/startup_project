var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    Homas = require('../models/Homas'),
    log4js = require('log4js'),
    logger = log4js.getLogger('admin'),
    util = require('../lib/util'),
    async = require('async'),
    _ = require('lodash'),
    sms = require('../lib/sms');

function main(req, res, next) {
    res.render('admin/main', {layout:null});
}

function fetchUserList(req, res, next) {
    User.find({}, function(err, collection) {
        if (err) {
            return res.send({success:false, reason:err.toString()});
        }
        res.send(collection);
    });
}

function sendSMS(req, res, next) {
    var data = req.body;
    sms.sendSMS(data.user_mobile, '', data.sms_content, function (result) {
        if (result.error) {
            return res.send({success:false, reason:result.msg});
        } else {
            res.send({success:true});
        }
    });
}

function fetchAppliesForUser(req, res, next) {
    logger.debug(req.params.uid);
    Apply.find({userID:req.params.uid}, function(err, collection) {
        if (err) {
            logger.error(err.toString());
        }
        res.send(collection);
    });
}

function updateApplyForUser(req, res, next) {
    console.log(req.body);
    var data = _.omit(req.body, ['start_date', 'end_date']);
    console.log(data);
    if (req.body._id) {
        Apply.update({_id:req.body._id}, req.body, function(err, numberAffected, raw) {
            if(err) {
                logger.warn('error when update apply by admin:', err.toString());
                res.status(500);
                return res.send({reason:err.toString()});
            }
            res.send(data);
        });
    } else {
        res.send({});
    }
}

function updateOrder(req, res) {
    if (req.body._id) {
        Order.update({_id:req.body._id}, req.body, function(err, numberAffected, raw) {
            if(err) {
                logger.warn('error when update order by admin:', err.toString());
                res.status(500);
                return res.send({reason:err.toString()});
            }
            res.send(req.body);
        });
    } else {
        res.send({});
    }
}

function fetchOrdersForUser(req, res) {
    logger.debug(req.params.uid);
    Order.find({userID:req.params.uid}, function(err, order) {
        if (err) {
            logger.error(err.toString());
            res.status(500);
            return res.send({success:false, reason:err.toString()});
        }
        res.send(order);
    });
}

function fetchNearExpireApplies(req, res) {
    var startTime = util.getStartDay();
    var endTime = util.getEndDay(startTime, 2).toDate();
    console.log(endTime);

    Apply.find({ $and: [{ endTime: {$lte: endTime } }, {status: 2}] }, function(err, applies) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            return res.send({success:false, reason:err.toString()});
        }
        res.send(applies);
    });
}

function updateUser(req, res) {
    if (req.body._id) {
        User.update({_id:req.body._id}, req.body, function(err, numberAffected, raw) {
            if(err) {
                logger.warn('error when update user by admin:', err.toString());
                res.status(500);
                return res.send({reason:err.toString()});
            }
            res.send(req.body);
        });
    } else {
        res.send({});
    }
}

function getUser(req, res) {
    User.findById(req.params.id, function(err, user){
        if (err) {
            logger.warn('error when get user:', err.toString());
            res.status(500);
            return res.send({reason:err.toString()});
        }
        res.send(user);
    });
}

function fetchClosingApplies(req, res) {
    Apply.find({status: 5}, function(err, applies) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            return res.send({success:false, reason:err.toString()});
        }
        res.send(applies);
    });
}

function assignAccoutToApply(req, res) {
    if (req.body.homas) {
        homasAssignAccount(req, res);
    } else {
        homasAutoAssignAccount(req, res);
    }
}

function homasAutoAssignAccount(req, res) {
    var apply = req.body.apply;
    async.waterfall([
        function(callback) {
            Homas.findOne({using:false}, function(err, homas) {
                if (!homas) {
                    err = 'no available homas account';
                }
                callback(err, homas);
            });
        },
        function (homas, callback) {
            homas.using = true;
            homas.assignAt = Date.now();
            homas.applyID = apply._id;
            homas.save(function(err) {
                callback(err, homas);
            });
        },
        function (homas, callback) {
            Apply.findById(apply._id, function(err, apply) {
                callback(err, apply, homas);
            });
        },
        function (apply, homas, callback) {
            apply.status = 2;
            apply.account = homas.account;
            apply.password = homas.password;
            var startDay = util.getStartDay();
            apply.startTime = startDay.toDate();
            apply.endTime = util.getEndDay(startDay, apply.period).toDate();
            apply.save(function (err) {
                callback(err, apply);
            });
        }
    ], function(err, apply) {
        if (err) {
            res.status(401);
            res.send({reason:err.toString()});
        } else {
            res.send({apply:apply});
        }
    });
}

function homasAssignAccount(req, res) {
    var apply = req.body.apply;
    var homas = req.body.homas;
    async.waterfall([
        function (callback) {
            Apply.findById(apply._id, function(err, apply) {
                callback(err, apply);
            });
        },
        function (apply, callback) {
            apply.status = 2;
            apply.account = homas.account;
            apply.password = homas.password;
            var startDay = util.getStartDay();
            apply.startTime = startDay.toDate();
            apply.endTime = util.getEndDay(startDay, apply.period).toDate();
            apply.save(function (err) {
                callback(err);
            });
        }
    ], function(err) {
        if (err) {
            res.status(401);
            res.send({reason:err.toString()});
        } else {
            res.send({success:true});
        }
    });
}

function closeApply(req, res) {
    console.log(req.body);
    var profit = req.body.profit;
    async.waterfall([
        function(callback) {
            Apply.findById(req.body.apply_id, function(err, apply) {
                callback(err, apply);
            });
        },
        function(apply, callback) {
            apply.status = 3;
            apply.profit = profit;
            apply.save(function (err) {
                callback(err, apply);
            });
        },
        function(apply, callback) {
            Homas.findOne({account:apply.account}, function(err, homas) {
                callback(err, apply, homas);
            });
        },
        function(apply, homas, callback) {
            if (!homas) {
                logger.warn('can not find homas account when close apply:' + apply.serialID);
                callback(null, apply);
            } else {
                homas.using = false;
                homas.applyID = null;
                homas.save(function(err) {
                    callback(err, apply);
                });
            }
        },
        function(apply, callback) {
            if (profit > 0) {
                var orderData = {
                    userID: apply.userID,
                    dealType: 4,
                    amount: profit,
                    status: 1,
                    description: '配资盈利',
                    payType: 2
                };
                Order.create(orderData, function(err, order) {
                    if (err || !order) {
                        logger.warn('failed create order for profit when close apply:' + apply.serialID);
                    }
                    callback(null, apply);
                });
            } else {
                callback(null, apply);
            }
        },
        function(apply, callback) {
            var balance;
            if (profit > 0) {
                balance = apply.deposit;
            } else {
                balance = apply.deposit + profit;
            }
            if (balance > 0) {
                var orderData = {
                    userID: apply.userID,
                    dealType: 5,
                    amount: balance,
                    status: 1,
                    description: '配资保证金返还',
                    payType: 2
                };
                Order.create(orderData, function(err, order) {
                    if (err || !order) {
                        logger.warn('failed create order for deposit return when close apply:' + apply.serialID);
                    }
                    callback(null, apply);
                });
            } else {
                callback(null, apply);
            }
        },
        function(apply, callback) {
            var balance = apply.deposit + profit;
            if (balance > 0) {
                User.findById(apply.userID, function(err, user) {
                    if (!user) {
                        logger.warn('failed update user when close apply:' + apply.serialID);
                    }
                    callback(err, user, balance);
                });
            } else {
                callback(null, null, balance);
            }
        },
        function(user, balance, callback) {
            if (user) {
                user.finance.balance += balance;
                user.save(function(err) {
                    callback(err);
                });
            } else {
                callback(null);
            }
        }
    ], function(err) {
        if (err) {
            logger.error('error happen when close apply:' + req.body.apply_id + ' err:' + err.toString());
            res.status(401);
            res.send({reason:err.toString()});
        } else {
            res.send({success:true});
        }
    });
}

function fetchGetProfitOrders(req, res) {
    Order.find({$and: [{ dealType: 3 }, {status: 0}]}, function(err, orders) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            return res.send({success:false, reason:err.toString()});
        }
        res.send(orders);
    });
}

function getApply(req, res) {
    Apply.findOne({serialID:req.params.serial_id}, function(err, apply) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            return res.send({reason:err.toString()});
        }
        res.send(apply);
    });
}

//var balance = apply.deposit + profit;
module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/admin', passportConf.requiresRole('admin'), main);

        app.get('/admin/api/users', passportConf.requiresRole('admin'), fetchUserList);

        app.post('/admin/api/send_sms', passportConf.requiresRole('admin'), sendSMS);

        app.get('/admin/api/user/:uid/applies', passportConf.requiresRole('admin'), fetchAppliesForUser);

        app.post('/admin/api/user/:uid/applies/:id', passportConf.requiresRole('admin'), updateApplyForUser);

        app.get('/admin/api/user/:uid/orders', passportConf.requiresRole('admin'), fetchOrdersForUser);

        app.post('/admin/api/user/:uid/orders/:id', passportConf.requiresRole('admin'), updateOrder);

        app.post('/admin/api/orders/:id', passportConf.requiresRole('admin'), updateOrder);

        app.get('/admin/api/applies/expire', passportConf.requiresRole('admin'), fetchNearExpireApplies);

        app.get('/admin/api/applies/closing', passportConf.requiresRole('admin'), fetchClosingApplies);

        app.post('/admin/api/users/:id', passportConf.requiresRole('admin'), updateUser);

        app.get('/admin/api/users/:id', passportConf.requiresRole('admin'), getUser);

        app.post('/admin/api/apply/assign_account', passportConf.requiresRole('admin'), assignAccoutToApply);

        app.post('/admin/api/close_apply', passportConf.requiresRole('admin'), closeApply);

        app.get('/admin/api/orders/get_profit', passportConf.requiresRole('admin'), fetchGetProfitOrders);

        app.get('/admin/api/applies/:serial_id', passportConf.requiresRole('admin'), getApply);

        app.get('/admin/*', passportConf.requiresRole('admin'), function(req, res, next) {
            res.render('admin/' + req.params[0], {layout:null});
        });
    }
};
