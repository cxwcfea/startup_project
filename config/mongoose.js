var mongoose = require('mongoose'),
    User = require('../models/User'),
    Homas = require('../models/Homas'),
    Order = require('../models/Order'),
    Apply = require('../models/Apply'),
    PPJ = require('../controllers/mockTrader');

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

function createDefaultPPJContract() {
    PPJ.Contract.find({}).exec(function(err, data) {
        if (data && data.length === 0) {
            var contracts = [
              {exchange:'future', stock_code:'IFCURR'},
              {exchange:'stock', stock_code:'BABA'},
              {exchange:'commodity', stock_code:'XAUUSD'},
              {exchange:'forex', stock_code:'EURUSD'}
            ];
            // Default invest target
            for (var cid in contracts) {
                var c = new PPJ.Contract(contracts[cid]);
                c.save(function(err) {
                    if (err) {
                        if (err.code == 11000) return;
                        console.log(err);
                    }
                });
            }
        }
    });
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
    createDefaultPPJContract();
};
