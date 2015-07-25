'use strict';
var util = require('../lib/util'),
    mockTrader = require('../controllers/mockTrader');

var channelName = 'futures';

var products = [
    {
        name: 'IF',
        historyKey: 'mt://future/IFHIST',
        currKey: 'mt://future/IFCURR',
        historyData: []
    },
    {
        name: 'EURUSD',
        historyKey: 'mt://forex/EURUSDHIST',
        currKey: 'mt://forex/EURUSD',
        historyData: []
    },
    {
        name: 'XAUUSD',
        historyKey: 'mt://commodity/XAUUSDHIST',
        currKey: 'mt://commodity/XAUUSD',
        historyData: []
    }
];

function fetchHistoryData(cb) {
    global.redis_client.lrange('mt://future/IFHIST', 0, -1, function(err, data) {
        if (err) {
            console.log(err.toString());
        }
        var ret = [];
        for (var i in data) {
            var line = data[i];
            line = JSON.parse(line.replace(/'/g, ''))[0];
            ret.unshift([parseInt(line.ts/1000), parseInt(line.LastPrice)]);
        }
        cb(ret);
    });
    for (var i = 1; i < products.length; ++i) {
        global.redis_client.lrange(products[i].historyKey, 0, -1, function(err, data) {
            if (err) {
                console.log(err.toString());
            }
            var ret = [];
            for (var i in data) {
                var line = data[i];
                line = JSON.parse(line.replace(/'/g, ''))[0];
                ret.unshift([parseInt(line.ts/1000), parseInt(line.LastPrice)]);
            }
            products[i].historyData = ret;
            console.log('got ' + products[i].name + ' data');
            console.log(products[i].historyData);
            cb();
        });
    }
}

function fetchNewData(cb) {
    global.redis_client.get('mt://future/IFCURR', function(err, data) {
        var ret = null;
        if (!err) {
            data = JSON.parse(data);
            ret = [parseInt(data.ts/1000), parseInt(data.LastPrice)];
        }
        //console.log('current data:', parseInt(data.ts/1000) + ' ' + parseInt(data.LastPrice));
        cb(err, ret);
    });
}

var historyData = [];

// Define the Socket.io configuration method
module.exports = function(io) {
    fetchHistoryData(function(data) {
        historyData = data;
    });
    io.on('connection', function(socket) {
        console.log(socket.id + ' connected');
        socket.on('join', function (user) {
            console.log(user.name + ' joined room ' + user.room);
            socket.emit('history_data', historyData);
        });
    });
    setInterval(function() {
        fetchHistoryData(function(data) {
            historyData = data;
            io.sockets.emit('history_data', data);
        });
    }, 600000);
    setInterval(function() {
        fetchNewData(function(err, data) {
            if (err) {
                console.log(err.toString());
                return;
            }
            if (data[0] > historyData[historyData.length-1][0]) {
                historyData.push(data);
                io.sockets.emit('new_data', data);
            }
        });
    }, 2000);
};
