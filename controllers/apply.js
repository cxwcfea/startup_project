var Apply = require('../models/Apply'),
    moment = require('moment'),
    config = require('../config/config'),
    util = require('../lib/util');

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
            res.status(500);
            return res.send({success:false, reason:err.toString()});
        }
        //req.session.applySummary = req.body;
        res.send({success:true, apply_id:apply.serialID});
    });
};

exports.getAppliesForUser = function(req, res, next) {
    Apply.find({userID:req.params.uid}, function(err, collection) {
        if (err) {
            res.status(400);
            return res.send({success:false})
        }
        res.send(collection);
    });
};

exports.confirmApply = function(req, res, next) {
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
            serialID: collection.serialID
        };

        if (shouldPay <= 0) {
            res.locals.applySummary.useBalance = true;
        }
        res.render('apply_confirm');
    });
};
