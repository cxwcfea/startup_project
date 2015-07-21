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

function test() {
    global.redis_client.get('mt://future/IFCURR', function(err, data) {
        data = JSON.parse(data);
        console.log('current data:', data.ts + ' ' + data.LastPrice);
    });
}

var historyData = [];

// Define the Socket.io configuration method
module.exports = function(io) {
    io.on('connection', function(socket) {
        console.log(socket.id + ' connected');
        socket.on('join', function (name) {
            console.log(name + ' joined');
            //socket.emit('history_data', historyData);
            //console.log(historyData);
            fetchHistoryData(function(data) {
                socket.emit('new_data', data);
            });
        });
    });
    setInterval(function() {
        fetchHistoryData(function(data) {
            io.sockets.emit('new_data', data);
        });
    }, 2000);
    setInterval(function() {
        test();
    }, 2000);
};
