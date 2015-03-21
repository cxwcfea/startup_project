var Order = require('../models/Order'),
    Apply = require('../models/Apply'),
    log4js = require('log4js'),
    moment = require('moment'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    logger = log4js.getLogger('admin');

exports.fetchOrdersForUser = function(req, res) {
    Order.find({userID:req.params.uid}, function(err, order) {
        if (err) {
            logger.error(err.toString());
            res.status(503);
            return res.send({success:false, reason:err.toString()});
        }
        res.send(order);
    });
};

exports.getOrderById = function(req, res) {
    Order.findOne({_id:req.params.id}).exec(function(err, order) {
        if (err) {
            res.status(500);
            res.send({success:false})
        }
        res.send(order);
    })
};

exports.addOrderForUser = function(req, res) {
    var orderData = req.body;
    Order.create(orderData, function(err, order) {
        if(err) {
            logger.error(err.toString());
            res.status(500);
            return res.send({success:false, reason:err.toString()});
        }
        if (order.applySerialID) {
            Apply.findOne({ serialID: order.applySerialID }, function(err, apply) {
                if (err) {
                    logger.error("error when save orderId to apply: " + err.toString());
                } else if (!apply) {
                    logger.error("error when save orderId to apply: apply " + order.applySerialID + " not found");
                } else {
                    if (apply.status === 1) {
                        apply.orderID = order._id;
                        apply.save(function(err) {
                            if (err) {
                                logger.error("error when save orderId to apply: " + err.toString());
                            }
                        });
                    }
                }
            });
        }
        res.send(order);
    });
};

exports.updateOrder = function(req, res) {
    var orderData = req.body;
    Order.update({_id:req.params.id}, orderData, function (err, numberAffected, raw) {
        if (err) {
            logger.warn('error when updateOrder:' + err.toString());
            return res.send({success:false, reason:err.toString()});
        }
        res.send({success:true});
    });
};

exports.confirmPayOrder = function(req, res, next) {
    Order.findOne({_id:req.params.orderID}).exec(function(err, order) {
        if (err) {
            logger.error(err.toString());
            next();
        }
        res.locals.order = order;
        res.locals.balance = (req.user.finance.balance + order.amount).toFixed(2);
        res.locals.shengOrderTime = moment().format("YYYYMMDDHHmmss");
        res.locals.callback_domain = config.pay_callback_domain;
        res.render('pay_confirm');
    })
};
