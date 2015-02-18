var Card = require('../models/Card');

exports.getCardsForUser = function(req, res, next) {
    Card.find({userID:req.params.uid}, function(err, collection) {
        if (err) {
            res.status(400);
            res.send({success:false})
        }
        res.send(collection);
    });
};

exports.addCard = function(req, res) {
    var cardData = req.body;
    Card.create(cardData, function(err, card) {
        if(err) {
            res.status(500);
            return res.send({success:false, reason:err.toString()});
        }
        res.send({success:true});
    });
};
