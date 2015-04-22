var mongoose = require('mongoose'),
    fs = require('fs'),
    moment = require('moment'),
    _ = require('lodash'),
    Apply = require('../models/Apply'),
    Card = require('../models/Card'),
    Order = require('../models/Order'),
    User = require('../models/User'),
    config = require('../config/config')['production'];

var dailyFreeApplyData = function(db) {
    console.log('dailyFreeApplyData');
    var endTime = moment();
    endTime.hour(15);
    endTime.minute(00);
    endTime.second(00);

    var startTime = endTime.clone();
    startTime = startTime.subtract(1, 'days');
    startTime = startTime.toDate();
    endTime = endTime.toDate();

    Apply.find({$and:[{closeAt:{$lte:endTime}}, {closeAt:{$gte:startTime}}, {isTrial:true}]}, function(err, applies) {
        if (err) {
            console.log(err.toString());
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("dailyFreeApplyData-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        applies.forEach(function (apply) {
            var data = apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
                + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
                + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
                + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge;
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        db.close();
    });
};


var options = {};
mongoose.connect(config.db, options);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error...'));
db.once('open', function callback() {
    console.log('goldenbull db opened');
    dailyFreeApplyData(db);
});

