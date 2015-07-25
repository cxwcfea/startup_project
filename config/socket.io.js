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
    /*
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
    */
    for (var j = 0; j < products.length; ++j) {
        (function(){
            var index = j;
            global.redis_client.lrange(products[index].historyKey, 0, -1, function(err, data) {
                if (err) {
                    console.log(err.toString());
                }
                var ret = [];
                for (var i in data) {
                    var line = data[i];
                    line = JSON.parse(line.replace(/'/g, ''))[0];
                    ret.unshift([parseInt(line.ts/1000), parseInt(line.LastPrice)]);
                }
                products[index].historyData = ret;
                if (index === 0) {
                    historyData = ret;
                }
                //console.log('got ' + products[index].name + ' data');
                //console.log(products[index].historyData);
                cb(index);
            });
        })();
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
        //historyData = data;
    });
    io.on('connection', function(socket) {
        console.log(socket.id + ' connected');
        socket.on('join', function (user) {
            console.log(user.name + ' joined room ' + user.room);
            socket.join(user.room);
            socket.emit('history_data', products[user.room].historyData);
        });
    });
    setInterval(function() {
        fetchHistoryData(function(productIndex) {
            //historyData = data;
            //if (productIndex === 0) {
                io.sockets.in(productIndex).broadcast.emit('history_data', products[productIndex].historyData);
            //}
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
                io.sockets.in(0).broadcast.emit('new_data', data);
            }
        });
    }, 2000);
};
