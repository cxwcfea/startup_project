var mongoose = require('mongoose'),
    User = require('../models/User'),
    Order = require('../models/Order');

function createDefaultUsers() {
    User.find({}).exec(function (err, collection) {
        if (collection.length === 0) {
            User.create({mobile: 13439695920, password: 'xxx', profile: {name:'cxwcfea'}, roles: ['admin']}, function (err, user) {
                if (err) console.log('create & find user err:' + err);
                if (user) {
                    createOrderDefaultUsers(user._id);
                }
            });
        }
    });
}

function createOrderDefaultUsers(uID) {
    Order.create({userID:uID, dealType:'充值', amount:1000, status:true, description: '10倍配资'});
    Order.create({userID:uID, dealType:'提现', amount:500, status:true, description: '10倍配资'});
}

var options = {
    server: {
        socketOptions: { keepAlive: 1 }
    }
};
module.exports = function(config) {
    mongoose.connect(config.db, options);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error...'));
    db.once('open', function callback() {
        console.log('goldenbull db opened');
    });

    createDefaultUsers();
};