var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    AlipayOrder = require('../models/AlipayOrder'),
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
    util.getPayUserNum(function(err, dataObj) {
        if (err) {
            dataObj.count = 0;
            dataObj.amount = 0;
            dataObj.deposit = 0;
        }
        res.locals.pay_user_count = dataObj.count;
        res.locals.amount = util.formatDisplayNum(dataObj.amount);
        res.locals.deposit = util.formatDisplayNum(dataObj.deposit);
        if (req.user && req.user.roles) {
            if (req.url.indexOf('/admin') == 0) {
                if (req.user.roles.indexOf('admin') !== -1) {
                    res.render('admin/main', {layout:null, bootstrappedUser: JSON.stringify(req.user)});
                } else if (req.user.roles.indexOf('support') !== -1) {
                    res.render('support/main', {layout:null, bootstrappedUser: JSON.stringify(req.user)});
                }
            } else if (req.url.indexOf('/support') == 0) {
                res.render('support/main', {layout:null, bootstrappedUser: JSON.stringify(req.user)});
            }
        }
    });
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
    Apply.find({userID:req.params.uid}, function(err, collection) {
        if (err) {
            logger.error(err.toString());
        }
        res.send(collection);
    });
}

function fetchAllApplies(req, res, next) {
    Apply.find({}, function(err, collection) {
        if (err) {
            logger.error(err.toString());
        }
        res.send(collection);
    });
}

function fetchAllOrders(req, res, next) {
    Order.find({}, function(err, collection) {
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
        payType: 4, // 银行转账
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
    homsAssignAccount(req, res);
}

function homsAssignAccount(req, res) {
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
            apply.endTime = util.getEndDay(startDay, apply.period, apply.type).toDate();
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
            })
        },
        function(apply, callback) {
            User.findById(apply.userID, function(err, user) {
                if (!user) {
                    err = '_closeApply error: user not found';
                }
                callback(err, user, apply);
            });
        },
        function(user, apply, callback) {
            util.applyClosed(user, apply, profit, function(err) {
                callback(err, apply, user.finance.balance);
            });
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
                Order.findById(req.params.order_id, function(err, order) {
                    if (!order) {
                        err = 'order not found';
                    } else {
                        if (order.status === 1) {
                            err = 'order already approved';
                        }
                    }
                    callback(err, order);
                });
            },
            function(order, callback) {
                Order.update({_id:req.params.order_id}, {status: 1, bankTransID:req.body.bank_trans_id, approvedBy:req.user.mobile, approvedAt:Date.now()}, function(err, numberAffected, raw) {
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
        if (!order) {
            logger.warn('confirmAlipayOrder error:order not found');
            res.status(400);
            return res.send({error_msg:'order not found'});
        }
        if (order.status != 2) {
            logger.warn('confirmAlipayOrder error: only order in not pay status can be approved');
            res.status(400);
            return res.send({error_msg:'only order in not pay status can be approved'});
        }
        User.findOne({'profile.alipay_account':order.otherInfo}, function(err, user) {
            if (err) {
                logger.warn('confirmAlipayOrder error:' + err.toString());
                res.status(500);
                return res.send({error_msg:err.toString()});
            }
            if (user && user._id != order.userID) {
                logger.warn('confirmAlipayOrder error:already have user bind to the alipay account');
                res.status(403);
                return res.send({error_msg:'the same alipay account can not pay for different niujin user'});
            }
            User.findById(order.userID, function(err, user) {
                if (err) {
                    logger.warn('confirmAlipayOrder error:' + err.toString());
                    res.status(500);
                    return res.send({error_msg:err.toString()});
                }
                if (!user) {
                    logger.warn('confirmAlipayOrder error:user not found');
                    res.status(400);
                    return res.send({error_msg:'confirmAlipayOrder error:user not found'});
                }

                order.bankTransID = req.body.trans_id;
                order.approvedBy = req.user.mobile;
                order.approvedAt = Date.now();

                user.profile.alipay_account = order.otherInfo;
                user.profile.alipay_name = order.transID;
                util.orderFinished(user, order, 1, function(err) {
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
                            if (apply.status === 1) {
                                util.applyConfirmed(user, apply, function(err) {
                                    if (err) {
                                        logger.error('confirmAlipayOrder error when confirm apply:' + err.toString());
                                        res.status(500);
                                        return res.send({error_msg:'confirmAlipayOrder error:' + err.toString()});
                                    }
                                    res.send({});
                                });
                            } else if (apply.status === 2) {
                                util.applyDepositAdded(user, apply, order.amount, function(err) {
                                    if (err) {
                                        logger.error('confirmAlipayOrder error when confirm apply for add deposit:' + err.toString());
                                        res.status(500);
                                        return res.send({error_msg:'confirmAlipayOrder error:' + err.toString()});
                                    }
                                    res.send({});
                                });
                            } else {
                                logger.error('confirmAlipayOrder error: apply not in valid state ' + apply.serialID);
                                res.status(400);
                                return res.send({error_msg:'confirmAlipayOrder error: apply not in valid state ' + apply.serialID});
                            }
                        });
                    } else {
                        res.send({});
                    }
                });
            });
        });
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

function getRechargeOrders(req, res) {
    Order.find({$and: [{dealType: 1},  {status: 0}]}, function(err, orders) {
        if (err) {
            logger.warn('getRechargeOrders error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send(orders);
    });
}

function confirmRechargeOrder(req, res) {
    Order.findById(req.params.id, function(err, order) {
        if (err) {
            logger.warn('confirmRechargeOrder error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        logger.info('confirmRechargeOrder operator:' + req.user.mobile);
        if (order) {
            if (order.status != 0) {
                logger.warn('confirmRechargeOrder error: only order in not pay status can be approved');
                res.status(400);
                return res.send({error_msg:'only order in not pay status can be approved'});
            }
            order.status = 1;
            // order.bankTransID = req.body.trans_id;
            order.approvedBy = req.user.mobile;
            order.approvedAt = Date.now();
            order.save(function(err) {
                if (err) {
                    logger.warn('confirmRechargeOrder error:' + err.toString());
                    res.status(500);
                    return res.send({error_msg:err.toString()});
                }
                User.findById(order.userID, function(err, user) {
                    if (err) {
                        logger.warn('confirmRechargeOrder error:' + err.toString());
                        res.status(500);
                        return res.send({error_msg:err.toString()});
                    }
                    if (user) {
                        user.finance.balance += order.amount;
                        user.save(function(err) {
                            if (err) {
                                logger.warn('confirmRechargeOrder error:' + err.toString());
                                res.status(500);
                                return res.send({error_msg:err.toString()});
                            }
                            util.sendSMS_4(user.mobile, order.amount.toFixed(2));
                            res.send({});
                        });
                    } else {
                        logger.warn('confirmRechargeOrder error:user not found');
                        res.status(400);
                        res.send({error_msg:'confirmRechargeOrder error:user not found'});
                    }
                });
            })
        } else {
            logger.warn('confirmRechargeOrder error:order not found');
            res.status(400);
            return res.send({error_msg:'order not found'});
        }
    });
}

function deleteRechargeOrder(req, res) {
    if (!req.body) {
        res.status(400);
        return res.send({error_msg:'empty request'});
    }
    logger.info('deleteRechargeOrder operator:' + req.user.mobile);
    Order.find({ $and: [{_id: req.params.id }, {status: 0}] }).remove(function(err, order) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send({});
    });
}

function deleteWithdrawOrder(req, res) {
    if (!req.body) {
        res.status(400);
        return res.send({error_msg:'empty request'});
    }
    logger.info('deleteWithdrawOrder operator:' + req.user.mobile);
    Order.findOne({ $and: [{_id: req.params.id }, {dealType: 2}] }, function(err, order) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (!order || order.status === 1) {
            res.status(400);
            logger.debug('deleteWithdrawOrder error:order not found or already handled');
            return res.send({error_msg:'deleteWithdrawOrder error:order not found or already handled'});
        }
        User.update({mobile:order.userMobile}, {$inc: {'finance.balance':order.amount, 'finance.freeze_capital':-order.amount}}, function(err, numberAffected, raw) {
            if (err) {
                logger.debug('deleteWithdrawOrder error:' + err.toString());
                res.status(500);
                return res.send({error_msg:err.toString()});
            }
            if (numberAffected == 0) {
                res.status(400);
                return res.send({error_msg:'user not found'});
            }
            order.remove(function(err) {
                if (err) {
                    logger.debug('deleteWithdrawOrder error:' + err.toString());
                    res.status(500);
                    return res.send({error_msg:err.toString()});
                }
                res.send({manager:req.user.mobile});
            });
        });
    });
}

function deleteOrderOfAlipay(req, res) {
    if (!req.body) {
        res.status(400);
        return res.send({error_msg:'empty request'});
    }
    AlipayOrder.findById(req.params.id).remove(function(err, order) {
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

function fetchOrdersOfAlipay(req, res) {
    AlipayOrder.find({}, function(err, orders) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send(orders);
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

function takeCustomer(req, res) {
    User.update({mobile:req.body.userMobile}, {$set: {'manager':req.user.mobile}}, function(err, numberAffected, raw) {
        if (err) {
            logger.debug('takeCustomer error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (numberAffected == 0) {
            res.status(400);
            return res.send({error_msg:'user not found'});
        }
        res.send({manager:req.user.mobile});
    });
}

function takeOrder(req, res) {
    Order.update({_id:req.body.id}, {$set: {'manager':req.user.mobile}}, function(err, numberAffected, raw) {
        if (err) {
            logger.debug('takeOrder error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (numberAffected == 0) {
            res.status(400);
            return res.send({error_msg:'order not found'});
        }
        res.send({manager:req.user.mobile});
    });
}

function takeApply(req, res) {
    Apply.update({serialID:req.body.id}, {$set: {'manager':req.user.mobile}}, function(err, numberAffected, raw) {
        if (err) {
            logger.debug('takeApply error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (numberAffected == 0) {
            res.status(400);
            return res.send({error_msg:'apply not found'});
        }
        res.send({manager:req.user.mobile});
    });
}

function changeApplyToPending(req, res) {
    Apply.update({serialID:req.body.serial_id}, {status:4}, function(err, numberAffected, raw) {
        if (err) {
            logger.debug('changeApplyToPending error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (numberAffected == 0) {
            res.status(400);
            return res.send({error_msg:'apply not found'});
        }
        res.send({});
    });
}

function sendSellSMS(req, res) {
    var startTime = moment().startOf('day');
    var endTime = startTime.clone();
    endTime.hour(15);
    endTime.minute(00);
    endTime.second(00);
    endTime = endTime.toDate();

    Apply.find({ $and: [{ endTime: {$lte: endTime } }, {endTime: {$gt: startTime.toDate()}}, {status: 2}] }, function(err, applies) {
        var mobile = {};
        var results = applies.filter(function(elem) {
            if (mobile[elem.userMobile]) {
                return false;
            } else {
                mobile[elem.userMobile] = true;
                return true;
            }
        });
        results.map(function(elem) {
            if (elem.isTrial) {
                util.sendSMS_10(elem.userMobile);
            } else {
                util.sendSMS_9(elem.userMobile, elem.amount);
            }
        });
        res.send({});
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
                "deposit": apply.isTrial ? 100 : apply.deposit,
                "lever":apply.isTrial ? 2000 : (apply.lever ? apply.lever - 1 : 9),
                "amount":apply.isTrial ? 2000 : apply.amount-apply.deposit,
                "margin_call":apply.isTrial ? 1900 : Number((apply.amount - config.warnFactor * apply.deposit).toFixed(2)),
                "close":apply.isTrial ? 1800 : Number((apply.amount - config.sellFactor * apply.deposit).toFixed(2))
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
            apply.endTime = util.getEndDay(startDay, apply.period, apply.type).toDate();
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
        Apply.update({serialID:serialID}, {status:2}, function(err, numberAffected, raw) {
            if(err) {
                logger.warn('error when return apply from closing to processing by admin:', err.toString());
                res.status(500);
                return res.send({'error_code':1, error_msg:err.toString()});
            }
            logger.info('change apply from closing to processing by admin when autoApproveClosingSettlement');
            res.send({"error_code":0});
        });
    }
}

function autoConfirmAlipayOrder(req, res) {
    var alipayAccount = req.query.alipay_account;
    var amount = Number(req.query.amount);
    var transID = req.query.trans_id;
    var name = req.query.name;

    async.waterfall([
        function (callback) {
            Order.findOne({bankTransID:transID}, function(err, order) {
                if (!err && order) {
                    err = "the alipay order already confirmed";
                }
                callback(err);
            })
        },
        function (callback) {
            User.findOne({'profile.alipay_account':alipayAccount}, function(err, user) {
                callback(err, user);
            });
        },
        function (user, callback) {
            if (user) {
                var orderData = {
                    userID: user._id,
                    userMobile: user.mobile,
                    dealType: 1,
                    amount: Number(amount.toFixed(2)),
                    description: '支付宝转账',
                    payType: 3,
                    status: 2,
                    otherInfo: alipayAccount,
                    transID: name,
                    bankTransID: transID
                };
                Order.create(orderData, function(err, order) {
                    if (!err && !order) {
                        err = 'failed create order when auto confirm alipay order';
                    }
                    callback(err, user, order, null);
                });
            } else {
                Order.findOne({ $and: [{ amount: amount }, {otherInfo: alipayAccount}, {transID: name}, {status: 2}] }, function(err, order) {
                    if (err) {
                        callback(err);
                    } else {
                        if (order) {
                            User.findById(order.userID, function(err, user) {
                                if (err) {
                                    callback(err);
                                } else {
                                    user.profile.alipay_account = order.otherInfo;
                                    user.profile.alipay_name = order.transID;
                                    var orderData = {
                                        userID: user._id,
                                        userMobile: user.mobile,
                                        dealType: 1,
                                        amount: Number(amount.toFixed(2)),
                                        description: '支付宝转账',
                                        payType: 3,
                                        status: 2,
                                        otherInfo: alipayAccount,
                                        transID: name,
                                        bankTransID: transID
                                    };
                                    Order.create(orderData, function(err, order) {
                                        if (!err && !order) {
                                            err = 'failed create order when auto confirm alipay order';
                                        }
                                        callback(err, user, order, null);
                                    });
                                }
                            });
                        } else {
                            var data = {
                                alipayAccount: alipayAccount,
                                amount: amount,
                                transID: transID,
                                name: name
                            };
                            AlipayOrder.create(data, function(err, alipayOrder) {
                                if (!err && !alipayOrder) {
                                    err = 'failed create alipay order when auto confirm alipay order';
                                }
                                callback(err, user, null, alipayOrder);
                            });
                        }
                    }
                });
            }
        },
        function(user, order, alipayOrder, callback) {
            if (order) {
                util.orderFinished(user, order, 1, function(err) {
                    if (!err) {
                        util.sendSMS_8(user.mobile, order.amount.toFixed(2));
                    }
                    callback(err, 'success update user for alipay order');
                });
            } else if (alipayOrder) {
                callback(null, 'success create alipay order when auto confirm alipay order');
            }
        }
    ], function(err, msg) {
        if (err) {
            logger.debug('autoConfirmAlipayOrder error ' + err.toString());
            res.status(500);
            res.send({error_code:1, error_msg:err.toString()});
        } else {
            logger.debug('autoConfirmAlipayOrder ' + msg);
            res.send({error_code:0});
        }
    });
}

function autoConfirmAddDepositOrder(req, res) {
    var order_id = req.query.id;
    if (order_id) {
        Order.update({_id:order_id}, {dealType:9}, function(err, numberAffected, raw) {
            if (numberAffected) {
                res.send({error_code:0});
            } else {
                logger.debug('autoConfirmAddDepositOrder error order not found');
                res.status(400);
                res.send({error_code:1, error_msg:'order not found'});
            }
        });
    } else {
        logger.debug('autoConfirmAddDepositOrder error order id not passed');
        res.status(400);
        res.send({error_code:1, error_msg:'order id not passed'});
    }
}

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/admin', passportConf.requiresRole('admin|support'), main);

        app.get('/support', passportConf.requiresRole('admin|support'), main);

        app.get('/admin/api/users', passportConf.requiresRole('admin|support'), fetchUserList);

        app.get('/admin/api/applies/all', passportConf.requiresRole('admin|support'), fetchAllApplies);

        app.get('/admin/api/orders/all', passportConf.requiresRole('admin|support'), fetchAllOrders);

        app.post('/admin/api/send_sms', passportConf.requiresRole('admin|support'), sendSMS);

        app.get('/admin/api/user/:uid/applies', passportConf.requiresRole('admin'), fetchAppliesForUser);

        app.get('/support/api/user/:uid/applies', passportConf.requiresRole('admin|support'), fetchAppliesForUser);

        app.get('/admin/api/user/:uid/applies/:id', passportConf.requiresRole('admin'), fetchApply);

        app.post('/admin/api/user/:uid/applies/:id', passportConf.requiresRole('admin'), updateApplyForUser);

        app.get('/admin/api/user/:uid/orders', passportConf.requiresRole('admin'), fetchOrdersForUser);

        app.get('/support/api/user/:uid/orders', passportConf.requiresRole('admin|support'), fetchOrdersForUser);

        app.post('/admin/api/user/:uid/orders/:id', passportConf.requiresRole('admin'), updateOrder);

        app.post('/admin/api/orders/:id', passportConf.requiresRole('admin|support'), updateOrder);

        app.get('/admin/api/applies/expire', passportConf.requiresRole('admin|support'), fetchNearExpireApplies);

        app.get('/admin/api/applies/closing', passportConf.requiresRole('admin|support'), fetchClosingApplies);

        app.get('/admin/api/applies/pending', passportConf.requiresRole('admin|support'), fetchPendingApplies);

        app.post('/admin/api/users/:id', passportConf.requiresRole('admin|support'), updateUser);

        app.get('/admin/api/users/:id', passportConf.requiresRole('admin|support'), getUser);

        app.post('/admin/api/apply/assign_account', passportConf.requiresRole('admin'), assignAccoutToApply);

        app.post('/admin/api/close_apply', passportConf.requiresRole('admin|support'), closeApply);

        app.get('/admin/api/orders/get_profit', passportConf.requiresRole('admin|support'), fetchGetProfitOrders);

        app.get('/admin/api/orders/withdraw', passportConf.requiresRole('admin'), fetchWithdrawOrders);

        app.post('/admin/api/user/withdraw/:order_id', passportConf.requiresRole('admin'), handleWithdrawOrder);

        app.get('/admin/api/orders/add_deposit', passportConf.requiresRole('admin|support'), fetchAddDepositOrders);

        app.get('/admin/api/applies/:serial_id', passportConf.requiresRole('admin'), getApply);

        app.get('/admin/api/orders/alipay', passportConf.requiresRole('admin|support'), getAlipayOrders);

        app.post('/admin/api/confirm_alipay_order/:id', passportConf.requiresRole('admin'), confirmAlipayOrder);

        app.post('/admin/api/delete_alipay_order/:id', passportConf.requiresRole('admin'), deleteAlipayOrder);

        app.get('/admin/api/orders/recharge', passportConf.requiresRole('admin|support'), getRechargeOrders);

        app.post('/admin/api/confirm_recharge_order/:id', passportConf.requiresRole('admin'), confirmRechargeOrder);

        app.post('/admin/api/delete_recharge_order/:id', passportConf.requiresRole('admin'), deleteRechargeOrder);

        app.post('/admin/api/delete_withdraw_order/:id', passportConf.requiresRole('admin'), deleteWithdrawOrder);

        app.post('/admin/api/delete_order_of_alipay/:id', passportConf.requiresRole('admin'), deleteOrderOfAlipay);

        app.get('/api/auto_fetch_pending_apply', passportConf.requiresRole('admin'), autoFetchPendingApplies);

        app.get('/api/auto_approve_apply', passportConf.requiresRole('admin'), autoApproveApply);

        app.get('/api/auto_fetch_closing_settlement', passportConf.requiresRole('admin'), autoFetchClosingSettlement);

        app.get('/api/auto_approve_closing_settlement', passportConf.requiresRole('admin'), autoApproveClosingSettlement);

        app.get('/api/auto_confirm_alipay_order', passportConf.requiresRole('admin'), autoConfirmAlipayOrder);

        app.get('/api/auto_confirm_add_deposit_order', passportConf.requiresRole('admin'), autoConfirmAddDepositOrder);

        app.post('/admin/api/create/order', passportConf.requiresRole('admin|support'), createOrder);

        app.post('/admin/api/take_customer', passportConf.requiresRole('admin|support'), takeCustomer);

        app.post('/admin/api/take_order', passportConf.requiresRole('admin|support'), takeOrder);

        app.post('/admin/api/take_apply', passportConf.requiresRole('admin|support'), takeApply);

        app.post('/admin/api/send_sell_sms', passportConf.requiresRole('admin|support'), sendSellSMS);

        app.get('/admin/api/alipay_orders', passportConf.requiresRole('admin'), fetchOrdersOfAlipay);

        app.post('/admin/change_apply_to_pending', passportConf.requiresRole('admin|support'), changeApplyToPending);

        app.get('/admin/*', passportConf.requiresRole('admin'), function(req, res, next) {
            res.render('admin/' + req.params[0], {layout:null});
        });
        app.get('/support/*', passportConf.requiresRole('admin|support'), function(req, res, next) {
            res.render('support/' + req.params[0], {layout:null});
        });
    }
};
