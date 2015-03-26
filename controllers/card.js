var Card = require('../models/Card');

exports.getCardsForUser = function(req, res, next) {
    Card.find({userID:req.params.uid}, function(err, collection) {
        if (err) {
            return res.send({success:false, reason:err.toString()});
        }
        res.send(collection);
    });
};

exports.addCard = function(req, res) {
    if (!req.body) {
        res.status(400);
        return res.send({error_msg:'empty request'});
    }
    if (req.body.userID != req.user._id) {
        res.status(400);
        return res.send({error_msg:'not the same user'});
    }
    var cardData = req.body;
    if (cardData.bankID < 0 || cardData.bankID > 18 || cardData.cardID <= 0) {
        res.status(400);
        return res.send({error_msg:'无效的数据'});
    }
    Card.create(cardData, function(err, card) {
        if(err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send(card);
    });
};
