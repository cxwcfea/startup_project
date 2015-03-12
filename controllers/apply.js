var Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    moment = require('moment'),
    config = require('../config/config'),
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
        var serviceFee = collection.amount / 10000 * config.parameters.serviceCharge * collection.period;
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
            orderID: collection.orderID
        };

        if (shouldPay <= 0) {
            res.locals.applySummary.useBalance = true;
        }

        if (collection.orderID) {
            Order.findById(collection.orderID, function(err, order) {
                if (order && order.transID) {
                    if (shouldPay === order.amount) {
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
        var serviceFee = collection.amount / 10000 * config.parameters.serviceCharge * collection.period;
        var warnValue = config.parameters.warnFactor * collection.amount;
        var sellValue = config.parameters.sellFactor * collection.amount;
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
