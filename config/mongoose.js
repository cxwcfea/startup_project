var mongoose = require('mongoose'),
    User = require('../models/User'),
    Homas = require('../models/Homas'),
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

            Homas.create({account: '123450', password: '111111'});
            Homas.create({account: '123451', password: '111111'});
            Homas.create({account: '123452', password: '111111'});
            Homas.create({account: '123453', password: '111111'});
            Homas.create({account: '123454', password: '111111'});
            Homas.create({account: '123455', password: '111111'});
            Homas.create({account: '123456', password: '111111'});
            Homas.create({account: '123457', password: '111111'});
            Homas.create({account: '123458', password: '111111'});
            Homas.create({account: '123459', password: '111111'});
            Homas.create({account: '123460', password: '111111'});
            Homas.create({account: '123461', password: '111111'});
            Homas.create({account: '123462', password: '111111'});
            Homas.create({account: '123463', password: '111111'});
            Homas.create({account: '123464', password: '111111'});
            Homas.create({account: '123465', password: '111111'});
            Homas.create({account: '123466', password: '111111'});
            Homas.create({account: '123467', password: '111111'});
            Homas.create({account: '123468', password: '111111'});
            Homas.create({account: '123469', password: '111111'});
        }
    });
}

function createOrderDefaultUsers(uID) {
    Order.create({userID:uID, dealType:'充值', amount:1000, status:1, description: '网站充值'});
    Order.create({userID:uID, dealType:'提现', amount:500, status:1, description: '提现'});
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