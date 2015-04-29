var mongoose = require('mongoose'),
    fs = require('fs'),
    moment = require('moment'),
    _ = require('lodash'),
    async = require('async'),
    util = require('./lib/util'),
    Apply = require('./models/Apply'),
    Card = require('./models/Card'),
    Order = require('./models/Order'),
    User = require('./models/User'),
    SalesData = require('./models/SalesData'),
    config = require('./config/config')['production'];

var startOfMonth = moment().startOf('month').toDate();
var endOfMonth = moment().endOf('month').toDate();
var startOfMonth = moment("2015-03-29").toDate();
var endOfMonth = moment("2015-04-25").toDate();
var month = moment().startOf('month').format('YYYYMM');
//console.log(startOfMonth);
//console.log(endOfMonth);

var applyData = {};

var gatherData = function(salesObj, callback) {
    console.log('gatherData');
    //console.log(applyData);

    User.find({$and:[{manager:salesObj.mobile}, {registered:true}, {registerAt:{$gte:startOfMonth}}, {registerAt:{$lte:endOfMonth}}]}, function(err, users) {
        if (err) {
            console.log(err.toString());
            return callback(err);
        }

        var profit = 0;
        var loss = 0;
        for (var i = 0; i < applyData.length; ++i) {
            if (applyData[i].manager == salesObj.mobile) {
                profit += applyData[i].amount;
                loss += applyData[i].loss;
            }
        }
        //console.log(profit);
        var payUsers = users.filter(function(user) {
            return user.finance.history_deposit > 100;
        });
        var payUserMobiles = payUsers.map(function(user) {
            return user.mobile;
        });
        var userMobiles = users.map(function(user) {
            return user.mobile;
        });

        var options = { encoding: 'utf8', flag: 'w' };
        var fileWriteStream = fs.createWriteStream("Sales-" + salesObj.mobile + "-2015-04.txt",  options);
        fileWriteStream.on("close", function() {
            console.log("File Closed.");
        });
        var data = '姓名, 坏账, 利润\n';
        fileWriteStream.write(data);
        data = salesObj.name + ', ' + loss.toFixed(2) + ', ' + profit.toFixed(2) + '\n';
        fileWriteStream.write(data);
        fileWriteStream.write('接手客户:\n');
        var j;
        for (j = 0; j < userMobiles.length; ++j) {
            fileWriteStream.write(userMobiles[j] + '\n');
        }
        fileWriteStream.write('转化客户:\n');
        for (j = 0; j < payUserMobiles.length; ++j) {
            fileWriteStream.write(payUserMobiles[j] + '\n');
        }
        fileWriteStream.end();

        SalesData.update({$and:[{month:month}, {userMobile:salesObj.mobile}]}, {newCustomers:userMobiles, newPayCustomers:payUserMobiles, profit:profit, loss:loss}, function(err, numberAffected, raw) {

        });
        callback(null, users);
    });
};

var getApplyServiceFee = function(apply) {
    var fee = 0;
    if (apply.serviceCharge) {
        fee = apply.serviceCharge;
    } else {
        switch (apply.lever) {
            case 10:
                fee = 19.9;
                break;
            case 9:
                fee = 18.9;
                break;
            case 8:
                fee = 17.9;
                break;
            case 7:
                fee = 16.9;
                break;
            case 6:
                fee = 15.9;
                break;
            case 5:
                fee = 10.9;
                break;
            default :
                fee = 19.9;
                break;
        }
    }
    var days = apply.period;
    if (apply.closeAt) {
        days = util.tradeDaysTillEnd(apply.startTime, apply.closeAt);
    } else {
        days = util.tradeDaysTillEnd(apply.startTime, apply.endTime);
    }
    if (apply.status === 3) {
        fee = fee * apply.amount / 10000 * days;
    } else {
        fee = fee * apply.amount / 10000 * util.tradeDaysTillEnd(apply.startTime, endOfMonth);
    }
    return fee;
};

var gatherApplyData = function(cb) {
    Apply.find({$and:[{startTime:{$lte:endOfMonth}}, {startTime:{$gte:startOfMonth}}, {status:{$ne:1}}, {status:{$ne:9}}, {status:{$ne:4}}, {isTrial:false}]}, function(err, applies) {
        if (err) {
            logger.debug('err when gatherApplyData' + err.toString());
            return cb(err);
        }
        var data = [];
        for (var i = 0; i < applies.length; ++i) {
            var fee = getApplyServiceFee(applies[i]);
            var loss = applies[i].profit + applies[i].deposit;
            var obj = {
                applySerialID: applies[i].serialID,
                mobile: applies[i].userMobile,
                amount: fee,
                loss: loss < 0 ? loss : 0
            };
            data.push(obj);
        }
        cb(null, data);
    });
};

var changeApplyData = function(applyObj, callback) {
    User.findOne({mobile:applyObj.mobile}, function (err, user) {
        if (err) {
            console.log(err.toString());
            return callback(err);
        }
        if (!user || !user.manager) {
            applyObj.manager = '';
        } else {
            applyObj.manager = user.manager;
        }
        callback(null, applyObj);
    })
};

var returnFeeOrderData = function(callback) {
    Order.find({$and:[{dealType:8}, {createdAt:{$lte:endOfMonth}}, {createdAt:{$gte:startOfMonth}}]}, function(err, orders) {
        if (err) {
            console.log(err.toString());
            callback(err);
            return;
        }
        var data = {};
        for (var i = 0; i < orders.length; ++i) {
            data[orders[i].applySerialID] = orders[i].amount;
        }
        callback(null, data);
    })
};

var sales = [
    {
        mobile: '13520978346',
        name: '秦亚景'
    },
    {
        mobile: '13488867185',
        name: '姜涛'
    },
    {
        mobile: '17709810065',
        name: '刘恩泽'
    },
    {
        mobile: '18911347741',
        name: '刘瑞'
    },
    {
        mobile: '18511565878',
        name: '刘亚东'
    },
    {
        mobile: '15101183931',
        name: '孟雪'
    },
    {
        mobile: '18931040286',
        name: '魏昊庚'
    }
    /*
    {
        mobile: '13439695920',
        name: '程翔'
    }
    */
];

var options = {};
mongoose.connect(config.db, options);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error...'));
db.once('open', function callback() {
    console.log('goldenbull db opened');

    SalesData.find({month:month}, function(err, collection) {
        if (collection && collection.length === 0) {
            sales.map(function (value) {
                SalesData.create({userMobile: value.mobile, name: value.name, month: month, baseSalary: 1000});
            });
        }
    });

    async.waterfall([
        function(callback) {
            gatherApplyData(function(err, applyData) {
                callback(err, applyData);
            });
        },
        function(applydata, callback) {
            returnFeeOrderData(function(err, orderData) {
                callback(err, applydata, orderData);
            });
        },
        function(applydata, orderdata, callback) {
            for (var i = 0; i < applydata.length; ++i) {
                if (orderdata[applydata[i].applySerialID]) {
                    applydata[i].amount -= orderdata[applydata[i].applySerialID];
                }
            }
            callback(null, applydata);
        },
        function(data, callback) {
            async.mapSeries(data, changeApplyData, function(err, result) {
                callback(err, result);
            })
        },
        function(data, callback) {
            applyData = data;
            async.mapSeries(sales, gatherData, function(err, result) {
                /*
                for (var i = 0; i < result.length; ++i) {
                    console.log(result[i].length);
                }
                */
                callback(err);
            });
        }
    ], function(err) {
        db.close();
        console.log('done');
        if (err) {
            console.log(err.toString());
        }
    });

});
