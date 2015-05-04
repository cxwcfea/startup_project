var mongoose = require('mongoose'),
    User = require('../models/User'),
    Homas = require('../models/Homas'),
    Order = require('../models/Order'),
    Apply = require('../models/Apply');
    Investor = require('../models/Investor');

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
    Investor.find({}).exec(function(err, collection) {
        if (collection && collection.length === 0) {
            Investor.create({userID: '55325e81afe92120a18a29ee', userMobile: '13810655219', profitRate: 12, amount: 50000, duration: 20, enable: true});
            Investor.create({userID: '55325e81afe92120a18a29ef', userMobile: '13121909306', profitRate: 13, amount: 30000, duration: 18, enable: true});
            Investor.create({userID: '5540adb4b19e7c60691d4240', userMobile: '18611724694', profitRate: 11, amount: 80000, duration: 16, enable: true});
            Investor.create({userID: '5540ae16b19e7c60691d4241', userMobile: '18910370016', profitRate: 11, amount: 10000, duration: 12, enable: true});
            Investor.create({userID: '55325e81afe92120a18a29ed', userMobile: '13439695920', profitRate: 18, amount: 100000, duration: 10, enable: true});
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