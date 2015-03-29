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
    logger.info('updateApplyForUser operator:' + req.user.mobile);
    var data = _.omit(req.body, ['start_date', 'end_date']);
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
        logger.info('updateOrder operator:' + req.user.mobile);
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

function createOrder(req, res) {
    if (!req.body || !req.body.userID || !req.body.userMobile || !req.body.order_type || !req.body.order_amount) {
        res.status(400);
        return res.send({});
    }
    if (req.body.order_type < 1 || req.body.order_amount < 0) {
        res.status(400);
        return res.send({});
    }
    logger.info('createOrder operator:' + req.user.mobile);
    var orderData = {
        userID: req.body.userID,
        userMobile: req.body.userMobile,
        dealType: req.body.order_type,
        amount: req.body.order_amount,
        status: 0,
        description: req.body.order_description ? req.body.order_description : '',
        bankTransID: req.body.order_bank_trans_id ? req.body.order_bank_trans_id : ''
    };
    Order.create(orderData, function(err, order) {
        if (err) {
            logger.debug('createOrder error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send({});
    });
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
        logger.info('updateUser operator:' + req.user.mobile);
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
    logger.info('assignAccountToApply operator:' + req.user.mobile);
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
            util.sendSMS_2(apply.userMobile, apply.amount.toFixed(2), apply.account, apply.password);
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
                if (apply.deposit < 0 || apply.amount < 0) {
                    err = '_closeApply error:apply data not correct';
                }
                callback(err, apply);
            });
        },
        function(apply, callback) {
            if (apply.status === 3) {
                callback('the apply already closed', null);
            } else {
                apply.status = 3;
                apply.profit = profit;
                apply.save(function (err) {
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
                if (balance < 1)
                    balance = 1;
            }
            User.findById(apply.userID, function(err, user) {
                if (!user) {
                    logger.warn('_closeApply error user not found:' + apply.userID);
                    err = '_closeApply error user not found:' + apply.userID;
                }
                callback(err, user, balance, apply);
            });
        },
        function(user, balance, apply, callback) {
            console.log(user);
            if (balance > 0) {
                user.finance.balance += balance;
            }
            user.finance.total_capital -= apply.amount;
            user.finance.deposit -= apply.deposit;
            if (profit > 0) {
                user.finance.profit += profit;
            }
            if (!apply.isTrial) {
                var tradeDays = util.tradeDaysTillNow(apply.startTime, apply.period);
                var totalServiceFee = util.getServiceFee(apply.amount, apply.period);
                var actualServiceFee = util.getServiceFee(apply.amount, tradeDays);
                var returnedServiceFee = totalServiceFee - actualServiceFee;
                if (totalServiceFee > 0) {
                    user.finance.freeze_capital -= totalServiceFee;
                }
                if (returnedServiceFee > 0) {
                    var orderData = {
                        userID: apply.userID,
                        dealType: 8,
                        amount: returnedServiceFee,
                        status: 1,
                        description: '管理费返还',
                        applySerialID: apply.serialID
                    };
                    user.finance.balance += returnedServiceFee;
                }
            }
            user.save(function(err) {
                console.log(user);
                callback(err, orderData, apply, balance);
            });
        },
        function(orderData, apply, balance, callback) {
            if (orderData) {
                Order.create(orderData, function(err, order) {
                    if (err || !order) {
                        logger.warn('failed create service fee return order when close apply:' + orderData.applySerialID);
                        err = 'failed create service fee return order when close apply:' + orderData.applySerialID;
                    }
                    callback(err, apply, balance);
                });
            } else {
                callback(null, apply, balance);
            }
        }
    ], function(err, apply, balance) {
        if (err) {
            logger.error('error happen when close apply:' + serialID + ' err:' + err.toString());
            res.status(401);
            res.send({"error_code":1, "error_msg":err.toString()});
        } else {
            var amount = balance > 0 ? balance : 0;
            util.sendSMS_3(apply.userMobile, amount, apply.deposit, profit);
            res.send({"error_code":0});
        }
    });
}

function closeApply(req, res) {
    logger.info('closeApply operator:' + req.user.mobile);
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
    Order.find({$and: [{ dealType: 2 }, { status: 0 }]}, function(err, orders) {
        if (err) {
            logger.warn(err.toString());
            res.status(401);
            return res.send({success:false, reason:err.toString()});
        }
        res.send(orders);
    });
}

function handleWithdrawOrder(req, res) {
    if (req.params.order_id && req.body && req.body.uid && req.body.bank_trans_id) {
        logger.info('handleWithdrawOrder operator:' + req.user.mobile);
        async.waterfall([
            function(callback) {
                Order.update({_id:req.params.order_id}, {status: 1, bankTransID:req.body.bank_trans_id}, function(err, numberAffected, raw) {
                    callback(err);
                });
            },
            function(callback) {
                Order.findById(req.params.order_id, function(err, order) {
                    callback(err, order);
                });
            },
            function(order, callback) {
                User.update({_id:req.body.uid}, {$inc: {'finance.freeze_capital':-order.amount}}, function(err, numberAffected, raw) {
                    callback(err, order);
                });
            }
        ], function(err, order) {
            if (err) {
                logger.warn('handleWithdrawOrder fail:', err.toString());
                res.status(500);
                return res.send({error_msg:err.toString()});
            } else {
                res.send(order);
            }
        });
    } else {
        res.status(400);
        res.send({});
    }
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
    Order.find({$and: [{payType: 3},  {status: 2}]}, function(err, orders) {
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
        logger.info('confirmAlipayOrder operator:' + req.user.mobile);
        if (order) {
            if (order.status != 2) {
                logger.warn('confirmAlipayOrder error: only order in not pay status can be approved');
                res.status(400);
                return res.send({error_msg:'only order in not pay status can be approved'});
            }
            order.status = 1;
            order.bankTransID = req.body.trans_id;
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
                            util.sendSMS_8(user.mobile, order.amount.toFixed(2));
                            if (order.applySerialID) {
                                Apply.findOne({serialID:order.applySerialID}, function(err, apply) {
                                    if (err) {
                                        logger.warn('confirmAlipayOrder error when update apply:' + err.toString());
                                        res.status(500);
                                        return res.send({error_msg:'confirmAlipayOrder error when update apply:' + err.toString()});
                                    }
                                    apply.status = 4;
                                    apply.save(function(err) {
                                        if (err) {
                                            logger.warn('confirmAlipayOrder error when update apply:' + err.toString());
                                            res.status(500);
                                            return res.send({error_msg:'confirmAlipayOrder error when update apply:' + err.toString()});
                                        }
                                        var serviceFee = util.getServiceFee(apply.amount, apply.period);
                                        if (apply.isTrial) {
                                            serviceFee = 0;
                                        }
                                        var total = serviceFee + apply.deposit;
                                        var orderData = {
                                            userID: user._id,
                                            userMobile: user.mobile,
                                            userBalance: user.finance.balance - apply.deposit,
                                            dealType: 9,
                                            amount: apply.deposit,
                                            status: 1,
                                            description: '支付配资保证金'
                                        };
                                        Order.create(orderData, function(err, order) {
                                            if (err) {
                                                logger.error('confirmAlipayOrder error when create order:' + err.toString());
                                                res.status(500);
                                                return res.send({error_msg:'confirmAlipayOrder error when create order:' + err.toString()});
                                            }
                                            user.update({$inc: {'finance.freeze_capital':serviceFee, 'finance.total_capital':apply.amount, 'finance.balance':-total, 'finance.deposit':apply.deposit}}, function(err, numberAffected, raw) {
                                                if (err) {
                                                    logger.error('confirmAlipayOrder error when update user:' + err.toString());
                                                    res.status(500);
                                                    return res.send({error_msg:'confirmAlipayOrder error:' + err.toString()});
                                                }
                                                res.send({});
                                            });
                                        });
                                    });
                                });
                            } else {
                                res.send({});
                            }
                        });
                    } else {
                        logger.warn('confirmAlipayOrder error:user not found');
                        res.status(400);
                        res.send({error_msg:'confirmAlipayOrder error:user not found'});
                    }
                });
            })
        } else {
            logger.warn('confirmAlipayOrder error:order not found');
            res.status(400);
            return res.send({error_msg:'order not found'});
        }
    });
}

function deleteAlipayOrder(req, res) {
    if (!req.body) {
        res.status(400);
        return res.send({error_msg:'empty request'});
    }
    logger.info('deleteAlipayOrder operator:' + req.user.mobile);
    Order.find({ $and: [{_id: req.params.id }, {status: 2}] }).remove(function(err, order) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send({});
    });
}

function fetchApply(req, res) {
    //console.log(req.body);
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
    //logger.debug('autoFetchPendingApplies operator:', req.user.mobile);
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
                "amount":apply.isTrial ? 2000 : apply.amount-apply.deposit,
                "margin_call":apply.isTrial ? 1800 : config.warnFactor * apply.amount,
                "close":apply.isTrial ? 1600 : config.sellFactor * apply.amount
            }
        });
        res.send(ret);
    });
}

function autoApproveApply(req, res) {
    //logger.debug('autoApproveApply operator:', req.user.mobile);
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
            util.sendSMS_2(apply.userMobile, apply.amount.toFixed(2), apply.account, apply.password);
            res.send({"error_code":0});
        }
    });
}

function autoFetchClosingSettlement(req, res) {
    //logger.debug('autoFetchClosingSettlement operator:', req.user.mobile);
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
    //logger.debug('autoApproveClosingSettlement operator:', req.user.mobile);
    var serialID = req.query.settlement_serialID;
    var success = req.query.success.toLowerCase();
    var profit = req.query.profit;
    if (success === 'true') {
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

        app.post('/admin/api/user/withdraw/:order_id', passportConf.requiresRole('admin'), handleWithdrawOrder);

        app.get('/admin/api/orders/add_deposit', passportConf.requiresRole('admin'), fetchAddDepositOrders);

        app.get('/admin/api/applies/:serial_id', passportConf.requiresRole('admin'), getApply);

        app.get('/admin/api/orders/alipay', passportConf.requiresRole('admin'), getAlipayOrders);

        app.post('/admin/api/confirm_alipay_order/:id', passportConf.requiresRole('admin'), confirmAlipayOrder);

        app.post('/admin/api/delete_alipay_order/:id', passportConf.requiresRole('admin'), deleteAlipayOrder);

        app.get('/api/auto_fetch_pending_apply', passportConf.requiresRole('admin'), autoFetchPendingApplies);

        app.get('/api/auto_approve_apply', passportConf.requiresRole('admin'), autoApproveApply);

        app.get('/api/auto_fetch_closing_settlement', passportConf.requiresRole('admin'), autoFetchClosingSettlement);

        app.get('/api/auto_approve_closing_settlement', passportConf.requiresRole('admin'), autoApproveClosingSettlement);

        app.post('/admin/api/create/order', passportConf.requiresRole('admin'), createOrder);

        app.get('/admin/*', passportConf.requiresRole('admin'), function(req, res, next) {
            res.render('admin/' + req.params[0], {layout:null});
        });
    }
};
