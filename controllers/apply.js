var Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    User = require('../models/User'),
    moment = require('moment'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    log4js = require('log4js'),
    logger = log4js.getLogger('apply'),
    _ = require('lodash'),
    async = require('async'),
    sms = require('../lib/sms'),
    util = require('../lib/util');

exports.getYYnPage = function(req, res, next) {
    res.locals.yyn_menu = true;
    res.render('apply/yyn');
};

exports.getApplyPage = function(req, res, next) {
    res.locals.apply_menu = true;
    res.render('apply/apply');
};

exports.getAppliesForUser = function(req, res, next) {
    Apply.find({userID:req.params.uid}, function(err, collection) {
        if (err) {
            return res.send({success:false, reason:err.toString()});
        }
        res.send(collection);
    });
};

exports.getApplyDetail = function (req, res, next) {
    Apply.findOne({serialID:req.params.id}, function(err, apply) {
        if (err || !apply) {
            return next();
        }
        if (apply.userMobile != req.user.mobile) {
            logger.debug('getApplyDetail error, the user:' + req.user.mobile + ' not have rights to see the apply of ' + apply.userMobile);
            return next();
        }
        var serviceFee = util.getServiceFee(apply, apply.period);
        if (apply.isTrial) {
            serviceFee = 0;
        }
        if (apply.startTime) {
            startTime = moment(apply.startTime);
            endTime = moment(apply.endTime);
        } else {
            startTime = util.getStartDay();
            endTime = util.getEndDay(startTime, apply.period, apply.type);
        }
        switch (apply.status) {
            case 1:
                res.locals.step = 1;
                break;
            case 4:
                res.locals.step = 2;
                break;
            case 2:
                res.locals.step = 3;
                break;
            case 5:
            case 3:
                res.locals.step = 4;
                break;
            default:
                res.locals.step = 1;
                break;
        }
        res.locals.apply_status = util.displayApplyStatus(apply.status);
        res.locals.apply_amount = apply.amount.toFixed(2);
        res.locals.apply_deposit = apply.deposit.toFixed(2);
        res.locals.apply_service_fee = serviceFee.toFixed(2);
        res.locals.apply_serialID = apply.serialID;
        res.locals.apply_applyAt = moment(apply.applyAt).format("YYYY-MM-DD HH:mm");
        res.locals.apply_pay = (apply.deposit + serviceFee).toFixed(2);
        res.locals.apply_period = apply.period;
        res.locals.apply_fee_per_day = (serviceFee / apply.period).toFixed(2);
        res.locals.apply_fee_per_month = serviceFee.toFixed(2);
        res.locals.apply_warn = apply.warnValue ? apply.warnValue.toFixed(2) : (apply.amount - config.warnFactor * apply.deposit).toFixed(2);
        res.locals.apply_sell = apply.sellValue ? apply.sellValue.toFixed(2) : (apply.amount - config.sellFactor * apply.deposit).toFixed(2);
        res.locals.startDate1 = startTime.format("YYYY-MM");
        res.locals.endDate1 = endTime.format("YYYY-MM");
        res.locals.startDate2 = startTime.format("DD");
        res.locals.endDate2 = endTime.format("DD");
        res.locals.pay_url = (apply.type === 2 ? '/yyn_confirm/' : '/apply_confirm/') + apply.serialID;
        res.locals.apply_account = apply.account;
        res.locals.apply_password = apply.password;
        res.locals.apply_detail = true;
        res.locals.apply_isTrial = apply.isTrial;
        res.locals.display_for_fee = apply.type === 2 ? '预付利息' : '预存账户管理费';
        res.locals.display_for_period = apply.type === 2 ? '使用月数' : '使用天数';
        res.locals.apply_type = apply.type;
        res.render('user/apply_detail');
    });
};

exports.getCloseApply = function(req, res, next) {
    res.render('apply_close');
};

exports.postCloseApply = function(req, res) {
    Apply.findOne({serialID:req.params.serial_id}, function(err, apply) {
        if (err) {
            logger.warn('postCloseApply ' + req.params.serial_id + ' error:' + err.toString());
            res.status(500);
            return res.send({reason:err.toString()});
        }
        if (!apply) {
            logger.warn('postCloseApply ' + req.params.serial_id + ' error:apply not found');
            res.status(400);
            return res.send({reason:'apply not found'});
        }
        if (req.user._id != apply.userID) {
            logger.warn('postCloseApply ' + req.params.serial_id + ' error:not the same user');
            res.status(400);
            return res.send({reason:'not the same user'});
        }
        if (apply.status != 2) {
            logger.warn('postCloseApply ' + req.params.serial_id + ' error:apply not in correct status');
            res.status(400);
            return res.send({reason:'apply not in correct status'});
        }
        apply.status = 5;
        apply.userCloseAt = Date.now();
        apply.save(function(err) {
            if (err) {
                logger.warn('postCloseApply ' + req.params.serial_id + ' error:' + err.toString());
                res.status(500);
                return res.send({reason:err.toString()});
            }
            res.send({success:true});
        });
    });
};

exports.getApplyPostpone = function(req, res, next) {
    Apply.findOne({serialID:req.params.serial_id}, function(err, apply) {
        if (err) {
            next();
        }
        res.locals.apply = apply;
        res.render('apply_postpone');
    });
};

exports.postApplyPostpone = function(req, res, next) {
    var period = Number(req.body.period);
    if (period <= 0 || period > 22) {
        res.status(400);
        return res.send({error_msg:'period invalid:' + period});
    }

    var serial_id = req.params.serial_id;

    async.waterfall([
        function(callback) {
            Apply.findOne({serialID:serial_id}, function(err, apply) {
                if (!apply) {
                    err = 'failed to find apply when postpone for apply:' + serial_id;
                } else if (apply.status !== 2) {
                    err = 'apply not in the valid state';
                }
                callback(err, apply);
            });
        },
        function(apply, callback) {
            var todayEndTime = moment();
            todayEndTime.hour(15);
            todayEndTime.minute(00);
            todayEndTime.second(00);
            todayEndTime = todayEndTime.toDate();

            var deadline = moment();
            deadline.hour(13);
            deadline.minute(00);
            deadline.second(00);

            var currentTime = moment();
            if (apply.endTime < todayEndTime && currentTime > deadline) {
                err = '1';
                callback(err);
            } else {
                callback(null, apply);
            }
        },
        function(apply, callback) {
            var amount = util.getServiceFee(apply, period);
            var orderData = {
                userID: apply.userID,
                userMobile: apply.userMobile,
                dealType: 10,
                amount: Number(amount.toFixed(2)),
                status: 2,
                description: '配资延期 ' + apply.serialID
                //applySerialID: apply.serialID   do not add serial id, so the pay order will only add balance for user
            };
            Order.create(orderData, function(err, order) {
                if (!err && !order) {
                    err = 'can not create pay order when postpone for apply:' + serial_id;
                }
                callback(err, order, apply);
            });
        },
        function(order, apply, callback) {
            User.findById(order.userID, function(err, user) {
                user.finance.balance = Number(user.finance.balance.toFixed(2));
                if (user.finance.balance >= order.amount) {
                    util.orderFinished(user, order, 2, function(err) {
                        callback(err, user, order, apply, true);
                    });
                } else {
                    order.dealType = 1;
                    order.description += ' 充值';
                    order.save(function(err) {
                        callback(err, user, order, apply, false);
                    });
                }
            });
        },
        function(user, order, apply, paid, callback) {
            if (paid) {
                apply.period += period;
                var startTime = moment(apply.startTime);
                apply.endTime = util.getEndDay(startTime, apply.period, apply.type).toDate();
                apply.save(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        user.finance.freeze_capital += order.amount;
                        user.finance.prepaid_service_fee += order.amount;
                        user.save(function(err) {
                            var content = 'user:' + order.userMobile + ' account:' + apply.account + ' period:' + period;
                            util.sendEmail('op@niujinwang.com', '配资延期', content, function(err) {
                                if (err) {
                                    logger.debug('error when send postpone email apply:' + apply.serialID + ' account:' + apply.account + ' ' + err.toString());
                                    sms.sendSMS('13439695920', '', 'apply postpone ' + content, function (result) {
                                        if (result.error) {
                                            logger.debug('sms also send error when postpone apply:' + apply.serialID);
                                        }
                                    });
                                }
                            });
                            callback(err, order, true);
                        });
                    }
                });
            } else {
                callback(null, order, false);
            }
        }
    ], function(err, order, paid) {
        if (err) {
            if (err == '1') {
                logger.warn('postpone error: 该配资已过延期的最后期限，无法延期');
                res.status(403);
                return res.send({error_msg:'该配资已过延期的最后期限，无法延期'});
            } else {
                logger.warn('postpone error:' + err.toString());
                res.status(500);
                return res.send({error_msg:err.toString()});
            }
        }
        res.send({order:order, paid:paid});
    });
};

exports.postGetProfit = function(req, res, next) {
    var amount = Number(req.body.amount);
    if (Number.isNaN(amount) || amount < 1) {
        res.status(400);
        return res.send({error_msg:'amount invalid:' + amount});
    }

    var serial_id = req.params.serial_id;

    Apply.findOne({serialID:serial_id}, function(err, apply) {
        if (err) {
            logger.warn('getProfit error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (!apply) {
            logger.warn('getProfit error apply not found:' + serial_id);
            res.status(400);
            return res.send('getProfit error apply not found:' + serial_id);
        }
        var orderData = {
            userID: apply.userID,
            userMobile: apply.userMobile,
            dealType: 3,
            amount: Number(amount.toFixed(2)),
            status: 2,
            description: '配资盈利提取',
            payType: 2,
            applySerialID: apply.serialID
        };
        Order.create(orderData, function(err, order) {
            if (err || !order) {
                logger.warn('failed create order when get profit for apply:' + apply.serialID);
                res.status(500);
                return res.send('failed create order when get profit for apply:' + serial_id);
            }
            var content = 'user:' + order.userMobile + ' account:' + apply.account + ' amount:' + order.amount;
            util.sendEmail2('op@niujinwang.com', '盈利提取', content, function(err) {
                logger.debug('get profit send email success');
            });
            res.send({});
        });
    });
};

exports.getAddDeposit = function(req, res, next) {
    Apply.findOne({serialID:req.params.serial_id}, function(err, apply) {
        if (err) {
            next();
        }
        res.locals.apply = apply;
        res.render('add_deposit');
    })
};

exports.addDeposit = function(req, res, next) {
    var amount = Number(req.body.deposit_amount);
    if (Number.isNaN(amount) || amount <= 0 || amount > 30000) {
        res.status(400);
        return res.send({error_msg:'deposit amount invalid:' + amount});
    }
    var serial_id = req.params.serial_id;
    async.waterfall([
        function(callback) {
            Apply.findOne({serialID:serial_id}, function(err, apply) {
                if (!apply) {
                    err = 'failed to find apply when add deposit for apply:' + serial_id;
                } else if (apply.status !== 2) {
                    err = 'apply not in the valid state';
                } //else  if (apply.userMobile != req.user.mobile) {
                  //  err = 'not the same user to do the request apply user:' + apply.userMobile + ' currentUser:' + req.user.mobile;
                //}
                callback(err, apply);
            });
        },
        function(apply, callback) {
            var orderData = {
                userID: apply.userID,
                userMobile: apply.userMobile,
                dealType: 6,
                amount: Number(amount.toFixed(2)),
                status: 2,
                description: '追加配资保证金 ' + apply.serialID
                //applySerialID: apply.serialID
            };
            Order.create(orderData, function(err, order) {
                if (!err && !order) {
                    err = 'can not create pay order when add deposit for apply:' + serial_id;
                }
                callback(err, order, apply);
            });
        },
        function(order, apply, callback) {
            User.findById(order.userID, function(err, user) {
                user.finance.balance = Number(user.finance.balance.toFixed(2));
                if (user.finance.balance >= order.amount) {
                    order.applySerialID = apply.serialID;
                    util.orderFinished(user, order, 2, function(err) {
                        callback(err, user, order, apply, true);
                    });
                } else {
                    order.dealType = 1;
                    order.description += ' 充值';
                    order.save(function(err) {
                        callback(err, user, order, apply, false);
                    });
                }
            });
        },
        function(user, order, apply, paid, callback) {
            if (paid) {
                apply.deposit += order.amount;
                apply.save(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        user.finance.deposit += order.amount;
                        user.finance.history_deposit += order.amount;
                        user.save(function(err) {
                            callback(err, order, apply, true);
                        });
                    }
                });
            } else {
                callback(null, order, apply, false);
            }
        },
        function(order, apply, paid, callback) {
            if (paid) {
                var content = 'user:' + order.userMobile + ' account:' + apply.account + ' amount:' + order.amount;
                util.sendEmail2('op@niujinwang.com', '追加配资保证金', content, function(err) {
                    logger.debug('add deposit send email success');
                });
                callback(null, order, paid);
            } else {
                callback(null, order, paid);
            }
        }
    ], function(err, order, paid) {
        if (err) {
            logger.warn('addDeposit error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send({order:order, paid:paid});
    });
};

// old approach
exports.postAddDeposit = function(req, res, next) {
    console.log(req.body);
    req.assert('deposit_amount', '金额必须是正数').isInt();
    req.assert('deposit_amount', '金额不能为空').notEmpty();

    var serial_id = req.params.serial_id;
    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/apply/add_deposit/' + serial_id);
    }
    var deposit = Number(req.body.deposit_amount);
    Apply.findOne({serialID:serial_id}, function(err, apply) {
        if (err) {
            logger.warn('error when add deposit for apply:' + apply.serialID);
            req.flash('errors', err);
            return res.redirect('/apply/add_deposit/' + serial_id);
        }
        if (!apply) {
            logger.warn('failed to find apply for when add deposit for apply:' + apply.serialID);
            req.flash('errors', {msg:'没有找到配资记录'});
            return res.redirect('/apply/add_deposit/' + serial_id);
        }
        if (apply.status !== 2) {
            req.flash('errors', {msg:'该配资不是操盘状态，操作无效'});
            return res.redirect('/apply/add_deposit/' + serial_id);
        }
        var orderData = {
            userID: apply.userID,
            dealType: 6,
            amount: Number(deposit.toFixed(2)),
            status: 2,
            description: '追加配资保证金',
            applySerialID: apply.serialID
        };
        Order.create(orderData, function(err, order) {
            if (err || !order) {
                logger.warn('failed create order when add deposit for apply:' + apply.serialID + ' err:' + err.toString());
                req.flash('errors', {msg:'创建订单失败'});
                return res.redirect('/apply/add_deposit/' + serial_id);
            }

            var shouldPay = deposit - req.user.finance.balance;
            res.locals.applySummary = {
                amount: apply.amount.toFixed(2),
                pre_deposit: apply.deposit.toFixed(2),
                deposit: deposit.toFixed(2),
                balance: req.user.finance.balance.toFixed(2),
                shouldPay: shouldPay.toFixed(2),
                serialID: apply.serialID,
                applyID: apply._id
            };
            res.locals.shengOrderTime = moment().format("YYYYMMDDHHmmss");
            res.locals.callback_domain = config.pay_callback_domain;

            if (shouldPay <= 0) {
                res.locals.applySummary.useBalance = true;
            }

            res.locals.applySummary.orderID = order._id;
            if (order && shouldPay === order.amount) {
                if (order.transID) {
                    res.locals.applySummary.transID = order.transID;
                }
            }
            res.render('apply_add_deposit_confirm');
        });
    });
};

exports.freeApply = function(req, res, next) {
    if (!req.user.identity.id) {
        res.locals.needIdentify = true;
        if (req.url.search('/mobile') > -1) {
            res.render('mobile/exp', {
                layout: 'mobile'
            });
        } else {
            res.render('apply/free_apply');
        }
        return;
    }
    User.find({'identity.id':req.user.identity.id}, function(err, users) {
        var valid = true;
        for (var i = 0; i < users.length; ++i) {
            if (users[i].freeApply) {
                valid = false;
                break;
            }
        }
        if (!valid) {
            res.locals.notValidForFreeApply = true;
            res.locals.userIdentityID = req.user.identity.id;
            if (req.url.search('/mobile') > -1) {
                res.render('mobile/exp', {
                    layout: 'mobile'
                });
            } else {
                res.render('apply/free_apply');
            }
            return;
        }
        if (!req.user.freeApply) {
            var startTime = moment().startOf('day');
            Apply.count({ $and: [{isTrial: true}, {applyAt: {$gte: startTime.toDate()}}] }, function (err, count) {
                if (err) {
                    logger.warn('freeApply error when count apply num ' + err.toString());
                    count = 201;
                }
                if (count >= 150) {
                    if (req.url.search('/mobile') > -1) {
                        res.redirect('/mobile/apply/pay_success?status=' + 9);
                    } else {
                        res.redirect('/apply/pay_success?status=' + 9);
                    }
                } else {
                    if (req.user.finance.balance >= 100) {
                        User.update({_id:req.user.id}, {$set:{'freeApply':true}}, function(err, numberAffected, raw) {
                            if (err) {
                                next();
                            } else if (!numberAffected) {
                                logger.warn('user:' + user.mobile + ' already tried free apply, refuse it');
                                res.locals.serial_id = user.freeApply;
                                if (req.url.search('/mobile') > -1) {
                                    res.render('mobile/free_apply_refuse', {
                                        layout: 'mobile'
                                    });
                                } else {
                                    res.render('apply/free_apply_refuse');
                                }
                            } else {
                                var applyData = new Apply({
                                    userID: req.user._id,
                                    userMobile: req.user.mobile,
                                    userName: req.user.identity.name,
                                    userIdentity: req.user.identity.id,
                                    serialID: util.generateSerialID(),
                                    amount: 2000,
                                    deposit: 100,
                                    isTrial: true,
                                    status: 4,
                                    period: 2
                                });
                                Apply.create(applyData, function(err, apply) {
                                    if(err) next();
                                    User.findById(req.user._id, function(err, user) {
                                        if (err) {
                                            logger.debug('freeApply error:' + err.toString());
                                            return next();
                                        }
                                        if (!user) {
                                            logger.debug('freeApply error: user not found');
                                            return next();
                                        }
                                        user.finance.balance -= 100;
                                        user.finance.total_capital += 2000;
                                        user.finance.deposit += 100;
                                        user.finance.history_capital += 2000;
                                        user.finance.history_deposit += 100;
                                        user.freeApply = apply.serialID;
                                        user.save(function (err, user) {
                                            if (err) {
                                                logger.debug('freeApply error:' + err.toString());
                                                return next();
                                            }
                                            var orderData = {
                                                userID: user._id,
                                                userMobile: user.mobile,
                                                userBalance: user.finance.balance,
                                                dealType: 9,
                                                amount: apply.deposit,
                                                status: 1,
                                                description: '免费体验支付保证金',
                                                applySerialID: apply.serialID
                                            };
                                            Order.create(orderData, function(err, payOrder) {
                                                if (err) {
                                                    logger.debug('freeApply error:' + err.toString());
                                                    return next();
                                                }
                                                if (req.url.search('/mobile') > -1) {
                                                    res.redirect('/mobile/apply/pay_success?serial_id=' + apply.serialID + '&amount=' + 2000 + '&status=' + 4);
                                                } else {
                                                    res.redirect('/apply/pay_success?serial_id=' + apply.serialID + '&amount=' + 2000 + '&status=' + 4);
                                                }
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    } else {
                        var orderData = {
                            userID: req.user._id,
                            userMobile: req.user.mobile,
                            dealType: 1,
                            amount: 100,
                            status: 2,
                            description: '免费配资体验充值'
                        };
                        Order.create(orderData, function(err, order) {
                            if (err) next();
                            //res.locals.addtional_pay_info = '您的余额不足1元，请先充值1元再申请免费体验';
                            if (req.url.search('/mobile') > -1) {
                                res.redirect('/mobile/#/recharge_alipay?order_id=' + order._id);
                            } else {
                                res.redirect('/recharge?order_id=' + order._id);
                            }
                        });
                    }
                }
            });
        } else {
            logger.warn('user:' + req.user.mobile + ' already tried free apply, refuse it');
            res.locals.serial_id = req.user.freeApply;
            if (req.url.search('/mobile') > -1) {
                res.render('mobile/free_apply_refuse', {
                    layout: 'mobile'
                });
            } else {
                res.render('apply/free_apply_refuse');
            }
        }
    });
};

exports.placeApply = function(req, res, next) {
    if (!req.isAuthenticated()) {
        req.session.lastLocation = '/apply';
        res.status(401);
        return res.send({success:false, reason:'not authenticate'});
    }

    if (!req.body.amount || !req.body.deposit) {
        logger.debug('placeApply error: invalid data');
        res.status(403);
        return res.send({error_msg:'invalid data'});
    }

    var amount = Number(Number(req.body.amount).toFixed(2));
    var deposit = Number(Number(req.body.deposit).toFixed(2));
    var lever = Math.round(amount / deposit);
    if (amount <= 0 || deposit <= 0 || lever > 6) {
        logger.debug('placeApply error: invalid data');
        res.status(403);
        return res.send({error_msg:'invalid data'});
    }

    if (deposit >= amount) {
        logger.debug('placeApply error: invalid data amount:' + req.body.amount + ' deposit:' + req.body.deposit);
        res.status(403);
        return res.send({error_msg:'invalid data'});
    }

    var applyData = new Apply({
        userID: req.user._id,
        userMobile: req.user.mobile,
        userName: req.user.identity.name,
        userIdentity: req.user.identity.id,
        serialID: util.generateSerialID(),
        amount: amount,
        deposit: deposit,
        lever: lever,
        warnValue: Number((amount - 0.4 * deposit).toFixed(2)),
        sellValue: Number((amount - 0.6 * deposit).toFixed(2)),
        serviceCharge: util.getServiceCharge(lever),
        discount: 1,
        period: 10
    });

    if (req.body.type) {
        applyData.type = req.body.type;
        if (applyData.type === 2) {
            applyData.period = req.body.month;
            applyData.interestRate = req.body.interestRate;
        }
    }

    Apply.create(applyData, function(err, apply) {
        if(err) {
            res.status(400);
            logger.warn('error when placeApply:' + err.toString());
            return res.send({success:false, reason:err.toString()});
        }
        res.send({apply_serial_id:apply.serialID});
    });
};

exports.yynConfirmApply = function(req, res, next) {
    res.locals.yyn_menu = true;
    Apply.findOne({serialID:req.params.serial_id}, function(err, apply) {
        if (err || !apply) {
            return next();
        }
        if (req.user._id != apply.userID) {
            res.status(406);
            logger.warn('error when yynConfirmApply: not the same user who create the apply');
            return next();
        }
        User.findById(apply.userID, function(err, user) {
            if (err) {
                logger.warn('error when yynConfirmApply:' + err.toString());
                return next();
            }
            var applyData = apply._doc;
            var applyVM = _.extend(applyData, {
                userBalance: user.finance.balance
            });
            res.render('apply/yyn_confirm', {
                bootstrappedApply: JSON.stringify(applyVM)
            });
        });
    });
};

exports.yynConfirmApply2 = function(req, res, next) {
    res.locals.yyn_menu = true;
    Apply.findOne({serialID:req.params.serial_id}, function(err, apply) {
        if (err || !apply) {
            return next();
        }
        if (req.user._id != apply.userID) {
            res.status(406);
            logger.warn('error when yynConfirmApply: not the same user who create the apply');
            return next();
        }
        User.findById(apply.userID, function(err, user) {
            if (err) {
                logger.warn('error when yynConfirmApply:' + err.toString());
                return next();
            }
            var applyData = apply._doc;
            var applyVM = _.extend(applyData, {
                userBalance: user.finance.balance
            });
            res.render('apply/yyn_confirm2', {
                bootstrappedApply: JSON.stringify(applyVM)
            });
        });
    });
};

exports.confirmApply = function(req, res, next) {
    res.locals.apply_menu = true;
    Apply.findOne({serialID:req.params.serial_id}, function(err, apply) {
        if (err || !apply) {
            return next();
        }
        if (req.user._id != apply.userID) {
            res.status(406);
            logger.warn('error when placeNewApply: not the same user who create the apply');
            return next();
        }
        User.findById(apply.userID, function(err, user) {
            if (err) {
                logger.warn('error when placeNewApply:' + err.toString());
                return next();
            }
            var applyData = apply._doc;
            var applyVM = _.extend(applyData, {
                userBalance: user.finance.balance
            });
            res.render('apply/apply_confirm', {
                bootstrappedApply: JSON.stringify(applyVM)
            });
        });
    });
};

exports.postConfirmApply = function(req, res, next) {
    var applyData = req.body;
    if (req.user._id != applyData.userID) {
        res.status(403);
        logger.warn('postConfirmApply error:apply is not belongs to the user');
        return res.send({reason:'apply is not belongs to the user'});
    }
    if (!req.user.identity.id) {
        res.status(403);
        logger.warn('postConfirmApply error:user must verify identity before apply:' + req.user.mobile);
        return res.send({error_code:1, error_msg:'user must verify identity before apply'});
    }
    Apply.count({ $and: [{isTrial: false}, {status: 2}, {userMobile:req.user.mobile}] }, function (err, count) {
        if (err) {
            logger.warn('postConfirmApply error when get apply count:' + err.toString());
            count = 0;
        }
        if (count >= 5) {
            res.status(403);
            logger.warn('postConfirmApply error:the same user have too much active apply');
            return res.send({error_code:2, reason:'the same user have too much active apply'});
        } else {
            var orderData = {
                userID: applyData.userID,
                userMobile: applyData.userMobile,
                dealType: applyData.shouldPay ? 1 : 9,
                amount: applyData.shouldPay ? Number(applyData.totalAmount.toFixed(2)) : Number(applyData.deposit.toFixed(2)),
                status: 2,
                description: '股票配资',
                applySerialID: applyData.serialID
            };
            Order.create(orderData, function(err, order) {
                if (err) {
                    res.status(503);
                    logger.warn('postConfirmApply error:' + err.toString());
                    return res.send({reason:err.toString()});
                }
                Apply.findById(applyData._id, function(err, apply) {
                    if (err) {
                        res.status(503);
                        logger.warn('postConfirmApply error:' + err.toString());
                        return res.send({error_msg:'postConfirmApply error:' + err.toString()});
                    }
                    apply.orderID = order._id;
                    apply.period = Number(applyData.period);
                    var startDay = util.getStartDay();
                    apply.startTime = startDay.toDate();
                    apply.endTime = util.getEndDay(startDay, apply.period, apply.type).toDate();
                    apply.autoPostpone = applyData.autoPostpone;
                    apply.save(function(err) {
                        if (err) {
                            res.status(500);
                            return res.send({error_msg:err.toString()});
                        }
                        res.send({order:order, apply:apply});
                    });
                });
            });
        }
    });
};

exports.paySuccess = function(req, res, next) {
    console.log('paySuccess');
    res.locals.apply_menu = true;
    res.locals.serial_id = req.query.serial_id;
    res.locals.amount = req.query.amount;
    var status = req.query.status;
    if (status == 9) {
        res.locals.pending = true;
    } else {
        res.locals.pending = false;
    }
    if (req.url.search('/mobile') > -1) {
        res.render('mobile/ttn_pay_success', {
            layout: 'mobile'
        });
    } else {
        res.render('apply/apply_pay_success');
    }
};

