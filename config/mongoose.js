var mongoose = require('mongoose'),
    User = require('../models/User');

function createDefaultUsers() {
    User.find({}).exec(function(err, collection) {
        if (collection.length === 0) {
            User.create({mobile:13439695920, password:'xxx', roles: ['admin']});
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
};