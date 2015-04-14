var mongoose = require('mongoose'),
    Apply = require('./models/Apply'),
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

var options = {};
mongoose.connect(config.db, options);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error...'));
db.once('open', function callback() {
    console.log('goldenbull db opened');
});
getPayUserNum();
