var mongoose = require('mongoose'),
    fs = require('fs'),
    moment = require('moment'),
    _ = require('lodash'),
    async = require('async'),
    Apply = require('../models/Apply'),
    Card = require('../models/Card'),
    Order = require('../models/Order'),
    User = require('../models/User'),
    config = require('../config/config')['production'];

var historyFreeApplyData = function(startTime, callback) {
    console.log('historyFreeApplyData');

    Apply.find({$and:[{$or:[{closeAt:{$lte:startTime}}, {closeAt:{$exists:false}}]}, {isTrial:true}, {status:3}]}, function(err, applies) {
        if (err) {
            console.log(err.toString());
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("historyFreeApplyDataTill-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        applies.forEach(function (apply) {
            data += apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
            + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
            + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
            + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var historyPayApplyData = function(startTime, callback) {
    console.log('historyPayApplyData');

    Apply.find({$and:[{$or:[{closeAt:{$lte:startTime}}, {closeAt:{$exists:false}}]}, {isTrial:false}, {status:3}]}, function(err, applies) {
        if (err) {
            console.log(err.toString());
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("historyPayApplyDataTill-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        applies.forEach(function (apply) {
            data += apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
            + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
            + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
            + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var dailyFreeApplyData = function(startTime, endTime, callback) {
    console.log('dailyFreeApplyData');

    Apply.find({$and:[{closeAt:{$lte:endTime}}, {closeAt:{$gte:startTime}}, {isTrial:true}, {status:3}]}, function(err, applies) {
        if (err) {
            console.log(err.toString());
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("dailyFreeApplyData-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        applies.forEach(function (apply) {
            data += apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
                + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
                + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
                + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var dailyPayApplyData = function(startTime, endTime, callback) {
    console.log('dailyPayApplyData');

    Apply.find({$and:[{closeAt:{$lte:endTime}}, {closeAt:{$gte:startTime}}, {isTrial:false}, {status:3}]}, function(err, applies) {
        if (err) {
            console.log(err.toString());
            callback(err);
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("dailyPayApplyData-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        applies.forEach(function (apply) {
            data += apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
            + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
            + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
            + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var dailyAddedPayApplyData = function(startTime, endTime, callback) {
    console.log('dailyAddedPayApplyData');

    Apply.find({$and:[{startTime:{$lte:endTime}}, {startTime:{$gte:startTime}}, {isTrial:false}, {status:2}]}, function(err, applies) {
        if (err) {
            console.log(err.toString());
            callback(err);
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("dailyAddedPayApplyData-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        applies.forEach(function (apply) {
            data += apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
            + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
            + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
            + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var dailyAddedFreeApplyData = function(startTime, endTime, callback) {
    console.log('dailyAddedFreeApplyData');

    Apply.find({$and:[{startTime:{$lte:endTime}}, {startTime:{$gte:startTime}}, {isTrial:true}, {status:2}]}, function(err, applies) {
        if (err) {
            console.log(err.toString());
            callback(err);
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("dailyAddedFreeApplyData-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        applies.forEach(function (apply) {
            data += apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
            + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
            + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
            + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var options = {};
mongoose.connect(config.db, options);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error...'));
db.once('open', function callback() {
    console.log('goldenbull db opened');
    var endTime = moment();
    endTime.hour(15);
    endTime.minute(00);
    endTime.second(00);

    var startTime = endTime.clone();
    startTime = startTime.subtract(1, 'days');
    startTime = startTime.toDate();
    endTime = endTime.toDate();
    async.series(
        [
            function(callback){
                dailyAddedPayApplyData(startTime, endTime, function(err) {
                    callback(err);
                });
            },
            function(callback){
                dailyAddedFreeApplyData(startTime, endTime, function(err) {
                    callback(err);
                });
            },
            function(callback){
                dailyFreeApplyData(startTime, endTime, function(err) {
                    callback(err);
                });
            },
            function(callback){
                dailyPayApplyData(startTime, endTime, function(err) {
                    callback(err);
                });
            }
        ],
        function(err){
            if (err) {
                console.log(err.toString());
            }
            db.close();
        });
});

