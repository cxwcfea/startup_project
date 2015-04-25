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
        var amount = 0;
        for (var i = 0; i < applies.length; ++i) {
            var value = applies[i].profit;
            if (value < 0) {
                amount += value;
            }
        }
        console.log('免费亏损 ' + amount);
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("historyFreeApplyDataTill-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        fileWriteStream.write(data);
        applies.forEach(function (apply) {
            data = apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
            + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
            + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
            + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();

        var fee = 0;
        for (var i = 0; i < applies.length; ++i) {
            if (applies[i].serviceCharge) {
                fee += applies[i].serviceCharge * applies[i].amount / 10000;
            } else {
                switch (applies[i].lever) {
                    case 10:
                        fee += 19.9 * applies[i].amount / 10000;
                        break;
                    case 9:
                        fee += 18.9 * applies[i].amount / 10000;
                        break;
                    case 8:
                        fee += 17.9 * applies[i].amount / 10000;
                        break;
                    case 7:
                        fee += 16.9 * applies[i].amount / 10000;
                        break;
                    case 6:
                        fee += 15.9 * applies[i].amount / 10000;
                        break;
                    case 5:
                        fee += 10.9 * applies[i].amount / 10000;
                        break;
                    default :
                        fee += 19.9 * applies[i].amount / 10000;
                        break;
                }
            }
        }
        console.log('total fee:' + fee.toFixed(2));

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
        var amount = 0;
        for (var i = 0; i < applies.length; ++i) {
            var value = applies[i].deposit + applies[i].profit;
            if (value < 0) {
                amount += value;
            }
        }
        console.log('穿仓 ' + amount);
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("historyPayApplyDataTill-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        fileWriteStream.write(data);
        applies.forEach(function (apply) {
            data = apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
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
        fileWriteStream.write(data);
        applies.forEach(function (apply) {
            data = apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
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
        fileWriteStream.write(data);
        applies.forEach(function (apply) {
            data = apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
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
        fileWriteStream.write(data);
        applies.forEach(function (apply) {
            data = apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
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
        fileWriteStream.write(data);
        applies.forEach(function (apply) {
            data = apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
            + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
            + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
            + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var dailyFreeApplyDataTillNow = function(callback) {
    console.log('dailyFreeApplyDataTillNow');

    Apply.find({$and:[{isTrial:true}, {status:2}]}, function(err, applies) {
        if (err) {
            console.log(err.toString());
            callback(err);
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("dailyFreeApplyDataTillNow-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        fileWriteStream.write(data);
        applies.forEach(function (apply) {
            data = apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
            + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
            + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
            + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var dailyPayApplyDataTillNow = function(callback) {
    console.log('dailyPayApplyDataTillNow');

    Apply.find({$and:[{isTrial:false}, {status:2}]}, function(err, applies) {
        if (err) {
            console.log(err.toString());
            callback(err);
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("dailyPayApplyDataTillNow-" + moment().format("YYYY-MM-DD") + ".txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, serialID, amount, deposit, period, status, applyAt, closeAt, isTrial, autoPostpone, lever, warnValue, sellValue, startTime, endTime, account, profit, type, interestRate, serviceCharge\n';
        fileWriteStream.write(data);
        applies.forEach(function (apply) {
            data = apply.userID + ', ' + apply.userMobile + ', ' + apply.serialID + ', ' + apply.amount.toFixed(2) + ', ' + apply.deposit.toFixed(2) + ', '
            + apply.period + ', ' + apply.status + ', ' + apply.applyAt + ', ' + apply.closeAt + ', ' + apply.isTrial + ', ' + apply.autoPostpone + ', '
            + apply.lever + ', ' + apply.warnValue + ', ' + apply.sellValue + ', ' + apply.startTime + ', ' + apply.endTime + ', ' + apply.account + ', '
            + apply.profit + ', ' + apply.type + ', ' + apply.interestRate + ', ' + apply.serviceCharge + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var incomeOrderData = function(callback) {
    Order.find({ $and: [{status:1}, {dealType:10}] }, function(err, orders) {
        if (err) {
            console.log(err.toString());
            callback(err);
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("IncomeOrderTillNow-" + moment().format("YYYY-MM-DD") + ".csv",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, userBalance, createdAt, dealType, amount, status, applySerialID, payType\n';
        fileWriteStream.write(data);
        orders.forEach(function (order) {
            data = order.userID + ', ' + order.userMobile + ', ' + order.userBalance + ', ' + order.createdAt + ', ' + order.dealType + ', '
            + order.amount.toFixed(2) + ', ' + order.status + ', ' + order.applySerialID + ', ' + order.payType + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var outcomeOrderData = function(callback) {
    Order.find({ $and: [{status:1}, {dealType:8}] }, function(err, orders) {
        if (err) {
            console.log(err.toString());
            callback(err);
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("outcomeOrderTillNow-" + moment().format("YYYY-MM-DD") + ".csv",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, userBalance, createdAt, dealType, amount, status, applySerialID, payType\n';
        fileWriteStream.write(data);
        orders.forEach(function (order) {
            data = order.userID + ', ' + order.userMobile + ', ' + order.userBalance + ', ' + order.createdAt + ', ' + order.dealType + ', '
            + order.amount.toFixed(2) + ', ' + order.status + ', ' + order.applySerialID + ', ' + order.payType + '\n';
            fileWriteStream.write(data);
        });
        fileWriteStream.end();
        callback(null);
    });
};

var allOrderData = function(callback) {
    Order.find({}, function(err, orders) {
        if (err) {
            console.log(err.toString());
            callback(err);
            return;
        }
        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("OrdersTillNow-" + moment().format("YYYY-MM-DD") + ".csv",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = 'userID, userMobile, userBalance, createdAt, dealType, amount, status, applySerialID, payType, bankTransID\n';
        fileWriteStream.write(data);
        orders.forEach(function (order) {
            data = order.userID + ', ' + order.userMobile + ', ' + order.userBalance + ', ' + order.createdAt + ', ' + order.dealType + ', '
            + order.amount.toFixed(2) + ', ' + order.status + ', ' + order.applySerialID + ', ' + order.payType + ', ' + order.bankTransID + '\n';
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
            /*
            function(callback) {
                historyFreeApplyData(startTime, function(err) {
                    callback(err);
                });
            },
            function(callback) {
                historyPayApplyData(startTime, function(err) {
                    callback(err);
                });
            }
            */
            function(callback){
                allOrderData(function(err) {
                    callback(err);
                });
            },
            /*
            function(callback){
                incomeOrderData(function(err) {
                    callback(err);
                });
            },
            function(callback){
                outcomeOrderData(function(err) {
                    callback(err);
                });
            },
            function(callback){
                dailyFreeApplyDataTillNow(function(err) {
                    callback(err);
                });
            },
            function(callback){
                dailyPayApplyDataTillNow(function(err) {
                    callback(err);
                });
            },
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
            */
        ],
        function(err){
            if (err) {
                console.log(err.toString());
            }
            db.close();
        });
});

