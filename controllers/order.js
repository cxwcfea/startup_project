var Order = require('../models/Order');

exports.getOrdersForUser = function(req, res) {
    Order.find({userID:req.params.uid}).exec(function(err, collection) {
        if (err) {
            res.status(500);
            res.send({success:false})
        }
        res.send(collection);
    })
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

exports.addOrder = function(req, res) {
    var orderData = req.body;
    Order.create(orderData, function(err, order) {
        if(err) {
            res.status(500);
            return res.send({success:false, reason:err.toString()});
        }
        return res.send({success:true, order:order});
    });
};

exports.updateOrder = function(req, res) {
    console.log('update');
    var orderData = req.body;
    Order.update({_id:req.params.id}, orderData, function (err, numberAffected, raw) {
        if (err) {
            res.status(500);
            return res.send({success:false, reason:err.toString()});
        }
        res.send({success:true});
    });
};
