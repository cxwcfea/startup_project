var mongoose = require('mongoose'),
    Apply = require('./models/Apply'),
    Card = require('./models/Card'),
    Order = require('./models/Order'),
    moment = require('moment'),
    User = require('./models/User'),
    config = require('./config/config')['production'];

var getPayUserNum = function() {
    console.log('getPayUserNum');
    Apply.find({ $and: [{isTrial:false}, {status:{$ne:1}}, {status:{$ne:9}}] }, function(err, applies) {
        if (err) {
            console.log('err when getPayUserNum ' + err.toString());
            return;
        }
        var count = 0;
        var nameMap = {};
        for (var i = 0; i < applies.length; ++i) {
            if (!nameMap[applies[i].userMobile]) {
                nameMap[applies[i].userMobile] = true;
                ++count;
            }
        }
        console.log('the total num of pay user is: ' + count);
    });
};

var withDrawOrder = function() {
    console.log('withdrawOrder');
    Order.find({$and:[{dealType:5},{amount:100.00}]}, function(err, order) {
        console.log(order.length);
        for(var i = 0; i < order.length; ++i) {
            User.findById(order[i].userID, function(err, user) {
                if (err) {
                    console.log('error ' + err.toString());
                    return;
                }
                if (!user) {
                    console.log('user not found');
                    return;
                }
                Card.find({userID:user._id}, function(err, card) {
                    if (!card) {
                        console.log('===============================');
                        console.log(user.mobile);
                        console.log('===============================');
                    } else {
                        for (var j = 0; j < card.length; ++j) {
                            console.log('===============================');
                            console.log(card[j].userName);
                            console.log(card[j].cardID);
                            console.log(user.mobile);
                            console.log('===============================');
                        }
                    }
                });
            });
        }
    });
    /*
     var today = moment().startOf('day');
     var yestoday = today.clone();
     yestoday = yestoday.subtract(1, 'days');
     today = today.toDate();
     yestoday = yestoday.toDate();
     Apply.find({$and:[{isTrial:true}, {status:{$ne:4}}, {endTime:{$lte:today}}, {endTime:{$gte:yestoday}}]}, function(err, applies) {
     console.log('run');
     if (err) {
     console.log('error ' + err.toString());
     return;
     }
     if (!applies) {
     console.log('applies not found');
     return;
     }
     console.log(applies.length);
     for (var i = 0; i < applies.length; ++i) {
     User.findById(applies[i].userID, function(err, user) {
     if (err) {
     console.log('error ' + err.toString());
     return;
     }
     if (!user) {
     console.log('user not found');
     return;
     }
     console.log(user);
     });
     }
     });
     */
};


var options = {};
mongoose.connect(config.db, options);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error...'));
db.once('open', function callback() {
    console.log('goldenbull db opened');
    withDrawOrder();
});
