var mongoose = require('mongoose'),
    Apply = require('./models/Apply'),
    Order = require('./models/Order'),
	User = require('./models/User'),
    moment = require('moment'),
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
    var today = moment().startOf('day');
    /*
    Order.find({ $and: [{approvedAt:{$gte:today}},  {dealType:2}] }, function(err, order) {
        if (err || !order) {
            console.log(err.toString());
        } else {

        }
    })
    */
    var yestoday = today.subtract(1, 'days');
    Apply.find({$and:[{isTrial:true}, {endTime:{$lte:today}}, {endTime:{$gte:yestoday}}]}, function(err, applies) {
        console.log('run');
        if (err) {
            console.log('error ' + err.toString());
            return;
        }
        if (!applies) {
            console.log('applies not found');
            return;
        }
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
};

var options = {};
mongoose.connect(config.db, options);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error...'));
db.once('open', function callback() {
    console.log('goldenbull db opened');
    withDrawOrder();
});
//getPayUserNum();
