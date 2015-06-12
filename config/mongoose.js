var mongoose = require('mongoose'),
    User = require('../models/User'),
    Homas = require('../models/Homas'),
    Order = require('../models/Order'),
    Apply = require('../models/Apply');

function createDefaultUsers() {
    User.find({}).exec(function (err, collection) {
        if (collection && collection.length === 0) {
            User.create({mobile: 13439695920, password: 'xxxxxx', registered:true, finance: {balance:100000}, profile: {name:'cxwcfea'}, roles: ['admin']}, function (err, user) {
                if (err) console.log('create & find user err:' + err);
                /*
                if (user) {
                    createOrderDefaultUsers(user._id);
                }
                */
            });

            User.create({mobile: 13810655219, registered:true, finance: {balance:1000}, password: 'xxxxxx', roles: ['admin']});
            User.create({mobile: 13121909306, registered:true, password: 'xxxxxx'});
            User.create({mobile: 18611724694, registered:true, password: 'xxxxxx'});
            User.create({mobile: 18910370016, registered:true, password: 'xxxxxx'});
            User.create({mobile: 18842602250, registered:true, password: 'xxxxxx'});
            User.create({mobile: 18842602250, registered:true, password: 'xxxxxx'});
        }
    });
}

function createOrderDefaultUsers(uID) {
    Order.create({userID:uID, dealType:1, amount:1000, status:1, description: '网站充值'});
    Order.create({userID:uID, dealType:2, amount:500, status:1, description: '提现'});
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