var moment = require('moment'),
    _ = require('lodash');

module.exports.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

module.exports.generateSerialID = function() {
    var sid = moment().format("YYYYMMDDHHmmSSS");
    sid += exports.getRandomInt(0, 9);
    return sid;
};