var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    Homas = require('../models/Homas'),
    log4js = require('log4js'),
    logger = log4js.getLogger('admin'),
    util = require('../lib/util'),
    async = require('async'),
    _ = require('lodash'),
    moment = require('moment'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
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
                callback(err, apply);
            });
        }
    ], function(err, apply) {
        if (err) {
            res.status(401);
            res.send({reason:err.toString()});
        } else {
            res.send({success:true, apply:apply});
        }
    });
}

function _closeApply(serialID, profit, res) {
    async.waterfall([
        function(callback) {
            Apply.findOne({serialID:serialID}, function(err, apply) {
                if (!apply) {
                    err = '_closeApply error:apply:' + serialID + ' not found';
                }
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
            if (apply.isTrial) {
                balance = 1;
            } else if (profit > 0) {
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
            if (apply.isTrial) {
                balance += 1;
                if (balance < 1)
                    balance = 1;
            }
            if (balance > 0) {
                User.findById(apply.userID, function(err, user) {
                    if (!user) {
                        logger.warn('failed update user when close apply:' + apply.serialID);
                    }
                    callback(err, user, balance, apply);
                });
            } else {
                callback(null, null, balance, apply);
            }
        },
        function(user, balance, apply, callback) {
            if (user) {
                console.log(user);
                user.finance.balance += balance;
                user.finance.total_capital -= apply.amount;
                user.finance.deposit -= apply.deposit;
                if (!apply.isTrial) {
                    var tradeDays = util.tradeDaysFromEndDay(apply.endTime, apply.period);
                    var totalServiceFee = util.getServiceFee(apply.amount, apply.period);
                    var actualServiceFee = util.getServiceFee(apply.amount, tradeDays);
                    var returnedServiceFee = totalServiceFee - actualServiceFee;
                    user.finance.freeze_capital -= totalServiceFee;
                    if (returnedServiceFee > 0) {
                        var orderData = {
                            userID: apply.userID,
                            dealType: 8,
                            amount: returnedServiceFee,
                            status: 1,
                            description: '管理费返回',
                            applySerialID: apply.serialID
                        };
                        user.finance.balance += returnedServiceFee;
                    }
                }
                user.save(function(err) {
                    console.log(user);
                    callback(err, orderData);
                });
            } else {
                callback(null, null);
            }
        },
        function(orderData, callback) {
            if (orderData) {
                Order.create(orderData, function(err, order) {
                    if (err || !order) {
                        logger.warn('failed create service fee return order when close apply:' + orderData.applySerialID);
                        err = 'failed create service fee return order when close apply:' + orderData.applySerialID;
                    }
                    callback(err);
                });
            } else {
                callback(null);
            }
        }
    ], function(err) {
        if (err) {
            logger.error('error happen when close apply:' + serialID + ' err:' + err.toString());
            res.status(401);
            res.send({"error_code":1, "error_msg":err.toString()});
        } else {
            res.send({"error_code":0});
        }
    });
}

function closeApply(req, res) {
    console.log(req.body);
    var profit = req.body.profit;
    _closeApply(req.body.apply_serial_id, Number(profit), res);
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

function fetchWithdrawOrders(req, res) {
    logger.debug('fetchWithdrawOrders');
    Order.find({$and: [{ dealType: 2 }, { status: 2 }]}, function(err, orders) {
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

function fetchAddDepositOrders(req, res) {
    var date = moment().startOf('day').toDate();
    Order.find({$and: [{ dealType: 6 },  {createdAt: {$gte:date}}]}, function(err, orders) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            return res.send({success:false, reason:err.toString()});
        }
        res.send(orders);
    });
}

function getAlipayOrders(req, res) {
    Order.find({$and: [{payType: 3},  {status: 0}]}, function(err, orders) {
        if (err) {
            logger.warn('getAlipayOrders error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send(orders);
    });
}

function confirmAlipayOrder(req, res) {
    Order.findById(req.params.id, function(err, order) {
        if (err) {
            logger.warn('confirmAlipayOrder error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (order) {
            order.status = 1;
            order.save(function(err) {
                if (err) {
                    logger.warn('confirmAlipayOrder error:' + err.toString());
                    res.status(500);
                    return res.send({error_msg:err.toString()});
                }
                User.findById(order.userID, function(err, user) {
                    if (err) {
                        logger.warn('confirmAlipayOrder error:' + err.toString());
                        res.status(500);
                        return res.send({error_msg:err.toString()});
                    }
                    if (user) {
                        user.finance.balance += order.amount;
                        user.save(function(err) {
                            if (err) {
                                logger.warn('confirmAlipayOrder error:' + err.toString());
                                res.status(500);
                                return res.send({error_msg:err.toString()});
                            }
                            res.send({});
                        });
                    }
                });
            })
        }
    });
}

function fetchApply(req, res) {
    console.log(req.body);
    Apply.findOne({serialID:req.params.id}, function(err, apply) {
        if (err) {
            logger.debug('error when fetchApply:' + err.toString());
            return res.send({});
        }
        res.send(apply);
    });
}

function fetchPendingApplies(req, res) {
    Apply.find({status: 4}, function(err, applies) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            return res.send({success:false, reason:err.toString()});
        }
        res.send(applies);
    });
}

function autoFetchPendingApplies(req, res) {
    logger.debug('autoFetchPendingApplies operator:', req.user.mobile);
    Apply.find({status: 4}, function(err, applies) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            return res.send({"error_code":0, "error_msg":err.toString()});
        }
        var ret = applies.map(function(apply) {
            return {
                "apply_serialID":apply.serialID,
                "mobile":apply.userMobile,
                "deposit": apply.isTrial ? 1 : apply.deposit,
                "lever":apply.isTrial ? 2000 : 9,
                "amount":apply.isTrial ? 2000 : apply.amount-deposit,
                "margin_call":apply.isTrial ? 0 : config.warnFactor * apply.amount,
                "close":apply.isTrial ? 0 : config.sellFactor * apply.amount
            }
        });
        res.send(ret);
    });
}

function autoApproveApply(req, res) {
    logger.debug('autoApproveApply operator:', req.user.mobile);
    var serialID = req.query.apply_serialID;
    var account = req.query.account;
    var password = req.query.password;

    async.waterfall([
        function (callback) {
            Apply.findOne({serialID:serialID}, function(err, apply) {
                callback(err, apply);
            });
        },
        function (apply, callback) {
            apply.status = 2;
            apply.account = account;
            apply.password = password;
            var startDay = util.getStartDay();
            apply.startTime = startDay.toDate();
            apply.endTime = util.getEndDay(startDay, apply.period).toDate();
            apply.save(function (err) {
                callback(err, apply);
            });
        }
    ], function(err, apply) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            res.send({"error_code":1, "error_msg":err.toString()});
        } else {
            res.send({"error_code":0});
        }
    });
}

function autoFetchClosingSettlement(req, res) {
    logger.debug('autoFetchClosingSettlement operator:', req.user.mobile);
    Apply.find({status: 5}, function(err, applies) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            return res.send({success:false, reason:err.toString()});
        }
        var ret = applies.map(function(apply) {
            return {
                "settlement_serialID":apply.serialID,
                "account":apply.account
            }
        });
        res.send(ret);
    });
}

function autoApproveClosingSettlement(req, res) {
    logger.debug('autoApproveClosingSettlement operator:', req.user.mobile);
    var serialID = req.query.settlement_serialID;
    var success = req.query.success;
    var profit = req.query.profit;
    if (success) {
        _closeApply(serialID, Number(profit), res);
    } else {
        res.send({"error_code":0});
    }
}

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/admin', passportConf.requiresRole('admin'), main);

        app.get('/admin/api/users', passportConf.requiresRole('admin'), fetchUserList);

        app.post('/admin/api/send_sms', passportConf.requiresRole('admin'), sendSMS);

        app.get('/admin/api/user/:uid/applies', passportConf.requiresRole('admin'), fetchAppliesForUser);

        app.get('/admin/api/user/:uid/applies/:id', passportConf.requiresRole('admin'), fetchApply);

        app.post('/admin/api/user/:uid/applies/:id', passportConf.requiresRole('admin'), updateApplyForUser);

        app.get('/admin/api/user/:uid/orders', passportConf.requiresRole('admin'), fetchOrdersForUser);

        app.post('/admin/api/user/:uid/orders/:id', passportConf.requiresRole('admin'), updateOrder);

        app.post('/admin/api/orders/:id', passportConf.requiresRole('admin'), updateOrder);

        app.get('/admin/api/applies/expire', passportConf.requiresRole('admin'), fetchNearExpireApplies);

        app.get('/admin/api/applies/closing', passportConf.requiresRole('admin'), fetchClosingApplies);

        app.get('/admin/api/applies/pending', passportConf.requiresRole('admin'), fetchPendingApplies);

        app.post('/admin/api/users/:id', passportConf.requiresRole('admin'), updateUser);

        app.get('/admin/api/users/:id', passportConf.requiresRole('admin'), getUser);

        app.post('/admin/api/apply/assign_account', passportConf.requiresRole('admin'), assignAccoutToApply);

        app.post('/admin/api/close_apply', passportConf.requiresRole('admin'), closeApply);

        app.get('/admin/api/orders/get_profit', passportConf.requiresRole('admin'), fetchGetProfitOrders);

        app.get('/admin/api/orders/withdraw', passportConf.requiresRole('admin'), fetchWithdrawOrders);

        app.get('/admin/api/orders/add_deposit', passportConf.requiresRole('admin'), fetchAddDepositOrders);

        app.get('/admin/api/applies/:serial_id', passportConf.requiresRole('admin'), getApply);

        app.get('/admin/api/orders/alipay', passportConf.requiresRole('admin'), getAlipayOrders);

        app.post('/admin/api/confirm_alipay_order/:id', passportConf.requiresRole('admin'), confirmAlipayOrder);

        app.get('/api/auto_fetch_pending_apply', passportConf.requiresRole('admin'), autoFetchPendingApplies);

        app.get('/api/auto_approve_apply', passportConf.requiresRole('admin'), autoApproveApply);

        app.get('/api/auto_fetch_closing_settlement', passportConf.requiresRole('admin'), autoFetchClosingSettlement);

        app.get('/api/auto_approve_closing_settlement', passportConf.requiresRole('admin'), autoApproveClosingSettlement);

        app.get('/admin/*', passportConf.requiresRole('admin'), function(req, res, next) {
            res.render('admin/' + req.params[0], {layout:null});
        });
    }
};
