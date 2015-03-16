var Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    moment = require('moment'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    log4js = require('log4js'),
    logger = log4js.getLogger('admin');
    util = require('../lib/util');

exports.getApplyPage = function(req, res, next) {
    res.locals.apply_menu = true;
    res.render('apply');
};

exports.placeApply = function(req, res, next) {
    if (!req.isAuthenticated()) {
        req.session.lastLocation = '/apply';
        return res.send({success:false, reason:'not authenticate'});
    }

    var applyData = new Apply({
        userID: req.user._id,
        serialID: util.generateSerialID(),
        amount: req.body.amount,
        deposit: req.body.deposit,
        period: req.body.day
    });

    Apply.create(applyData, function(err, apply) {
        if(err) {
            return res.send({success:false, reason:err.toString()});
        }
        //req.session.applySummary = req.body;
        res.send({success:true, apply_id:apply.serialID});
    });
};

exports.getAppliesForUser = function(req, res, next) {
    Apply.find({userID:req.params.uid}, function(err, collection) {
        if (err) {
            return res.send({success:false, reason:err.toString()});
        }
        res.send(collection);
    });
};

exports.confirmApply = function(req, res, next) {
    res.locals.apply_menu = true;
    Apply.findOne({serialID:req.params.id}, function(err, collection) {
        if (err) {
            next();
        }
        var serviceFee = collection.amount / 10000 * config.serviceCharge * collection.period;
        var total = collection.deposit + serviceFee;
        var shouldPay = total - req.user.finance.balance;
        res.locals.applySummary = {
            amount: collection.amount.toFixed(2),
            deposit: collection.deposit.toFixed(2),
            charge: serviceFee.toFixed(2),
            total: total.toFixed(2),
            balance: req.user.finance.balance.toFixed(2),
            shouldPay: shouldPay.toFixed(2),
            serialID: collection.serialID,
            applyID: collection._id
        };
        res.locals.shengOrderTime = moment().format("YYYYMMDDHHmmss");

        if (shouldPay <= 0) {
            res.locals.applySummary.useBalance = true;
        }

        if (collection.orderID) {
            Order.findById(collection.orderID, function(err, order) {
                if (order && shouldPay === order.amount) {
                    res.locals.applySummary.orderID = order._id;
                    if (order.transID) {
                        res.locals.applySummary.transID = order.transID;
                    }
                }
                res.render('apply_confirm');
            });
        } else {
            res.render('apply_confirm');
        }
    });
};

exports.getApplyDetail = function (req, res, next) {
    Apply.findOne({serialID:req.params.id}, function(err, collection) {
        if (err) {
            next();
        }
        console.log(collection);
        if (collection.status === 5) {
            return res.redirect(302, '/user/apply_close');
        }
        var serviceFee = collection.amount / 10000 * config.serviceCharge * collection.period;
        var warnValue = config.warnFactor * collection.amount;
        var sellValue = config.sellFactor * collection.amount;
        var startTime, endTime;
        if (collection.startTime) {
            startTime = moment(collection.startTime);
            endTime = moment(collection.endTime);
        } else {
            startTime = util.getStartDay();
            endTime = util.getEndDay(startTime, collection.period);
        }
        res.locals.applySummary = {
            amount: collection.amount.toFixed(2),
            deposit: collection.deposit.toFixed(2),
            charge: serviceFee.toFixed(2),
            balance: req.user.finance.balance.toFixed(2),
            warnValue: warnValue.toFixed(2),
            sellValue: sellValue.toFixed(2),
            startDate: startTime.format("YYYY-MM-DD HH:mm"),
            endDate: endTime.format("YYYY-MM-DD HH:mm"),
            checking: collection.status === 4 || collection.status === 1,
            account: collection.account,
            password: collection.password,
            serialID: collection.serialID
        };

        res.render('apply_detail');
    });
};

exports.getCloseApply = function(req, res, next) {
    /*
    Apply.findOne({serialID:req.params.id}, function(err, apply) {
        var today = moment();
        res.locals.amount = apply.amount.toFixed(2);
        res.locals.deposit = apply.deposit.toFixed(2);
        res.locals.days = today.dayOfYear() - moment(apply.startTime).dayOfYear();
        res.locals.endTime = moment(apply.endTime).format("YYYY-MM-DD HH:mm");
        res.render('apply_close');
    });
    */
    res.render('apply_close');
};

exports.postCloseApply = function(req, res) {
    Apply.update({serialID:req.params.serial_id}, {status:5}, function (err, numberAffected, raw) {
        if (err) {
            return res.send({success:false, reason:err.toString()});
        }
        res.send({success:true});
    });
};

exports.getProfit = function(req, res, next) {
    Apply.findOne({serialID:req.params.serial_id}, function(err, apply) {
        if (err) {
            next();
        }
        res.locals.apply = apply;
        res.render('get_profit');
    });
};

exports.postGetProfit = function(req, res, next) {
    req.assert('profit_amount', '金额必须是正数').isInt();
    req.assert('profit_amount', '金额不能为空').notEmpty();

    var serial_id = req.params.serial_id;
    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/apply/get_profit/' + serial_id);
    }
    var profit = req.body.profit_amount;
    Apply.findOne({serialID:serial_id}, function(err, apply) {
        if (err) {
            logger.warn('error when get profit for apply:' + apply.serialID);
            req.flash('errors', err);
            return res.redirect('/apply/get_profit/' + serial_id);
        }
        if (!apply) {
            logger.warn('failed to find apply for when get profit for apply:' + apply.serialID);
            req.flash('errors', {msg:'没有找到配资记录'});
            return res.redirect('/apply/get_profit/' + serial_id);
        }
        var orderData = {
            userID: apply.userID,
            dealType: 3,
            amount: profit,
            status: 0,
            description: '配资盈利提取',
            payType: 2,
            applySerialID: apply.serialID
        };
        Order.create(orderData, function(err, order) {
            if (err || !order) {
                logger.warn('failed create order when get profit for apply:' + apply.serialID);
                req.flash('errors', {msg:'创建订单失败'});
                return res.redirect('/apply/get_profit/' + serial_id);
            }
            req.flash('info', {msg:'申请提交成功，订单已创建，我们会尽快处理'});
            res.redirect('/apply_detail/' + serial_id);
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
            amount: deposit,
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