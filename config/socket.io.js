'use strict';
var util = require('../lib/util'),
    mockTrader = require('../controllers/mockTrader');

var channelName = 'futures';
//var users

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
}

function fetchNewData(cb) {
    global.redis_client.get('mt://future/IFCURR', function(err, data) {
        data = JSON.parse(data);
        //console.log('current data:', parseInt(data.ts/1000) + ' ' + parseInt(data.LastPrice));
        cb(err, [parseInt(data.ts/1000), parseInt(data.LastPrice)]);
    });
}

var historyData = [];

// Define the Socket.io configuration method
module.exports = function(io) {
    io.on('connection', function(socket) {
        console.log(socket.id + ' connected');
        socket.on('join', function (name) {
            console.log(name + ' joined');
            fetchHistoryData(function(data) {
                socket.emit('history_data', data);
                //io.sockets.emit('history_data', historyData);
            });
        });
    });
    setInterval(function() {
        fetchHistoryData(function(data) {
            //historyData = data;
            io.sockets.emit('history_data', data);
        });
    }, 2000);
    /*
    setInterval(function() {
        fetchNewData(function(err, data) {
            historyData.push(data);
            io.sockets.emit('new_data', data);
        });
    }, 2000);
    */
};
