var Apply = require('../models/Apply'),
    moment = require('moment'),
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
        req.session.applySummary = req.body;
        res.send({success:true});
    });
};
