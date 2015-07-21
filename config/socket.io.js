'use strict';
var util = require('../lib/util'),
    mockTrader = require('../controllers/mockTrader');

var channelName = 'futures';
//var users

function generateBlankData(timestamp, lastPoint) {
    var endTime = timestamp + 2 * 3600 * 1000 + 15 * 60000;
    var ret = [];
    var startTime = lastPoint[0];
    while (startTime < endTime) {
        startTime += 1000;
        ret.push([startTime, null]);
    }
    return ret;
}

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
        //var blankData = generateBlankData(ret[0][0], ret[ret.length-1]);
        cb(ret);
    });
}

function test() {
    var data = [], time = (new Date()).getTime(), i;

    for (i = -999; i <= 0; i += 1) {
        data.push([
            time + i * 1000 * 60,
            util.getRandomInt(3600, 4000)
        ]);
    }
    console.log('test data');
    console.log(data);
    return data;
}
//test();

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
};
