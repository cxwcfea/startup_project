'use strict';
var util = require('../lib/util'),
    mockTrader = require('../controllers/mockTrader');

var channelName = 'futures';
//var users

function fetchHistoryData(cb) {
    global.redis_client.lrange('mt://future/IFHIST', 0, 999, function(err, data) {
        if (err) {
            console.log(err.toString());
        }
        var ret = [];
        for (var i in data) {
            var line = data[i];
            line = JSON.parse(line.replace(/'/g, ''))[0];
            //console.log(JSON.parse(line));
            ret.unshift([parseInt(line.ts/1000), parseInt(line.LastPrice)]);
        }
        //console.log(ret);
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
            socket.emit('history_data', historyData);
            //console.log(historyData);
            fetchHistoryData(function(data) {
                socket.emit('history_data', data);
            });
        });
    });
    setInterval(function() {
        fetchHistoryData(function(data) {
            io.sockets.emit('new_data', data);
        });
        /*
         mockTrader.getLastFuturesPrice(function(err, data) {
         if (err) {
         console.log('getLastFuturesPrice error:' + err.toString());
         var x = (new Date()).getTime(), // current time
         y = util.getRandomInt(3600, 4000);
         historyData.unshift([x, y]);
         io.sockets.emit('new_data', [x, y]);
         } else {
         var x = parseInt(data.ts/1000), // current time
         y = parseInt(data.lastPrice);
         historyData.unshift([x, y]);
         io.sockets.emit('new_data', [x, y]);
         }
         });
         */
    }, 2000);
    /*
    global.redis_client.lrange('mt://future/IFHIST', 0, 999, function(err, data) {
        if (err) {
            console.log(err.toString());
        }
        for (var i in data) {
            var line = data[i];
            line = JSON.parse(line.replace(/'/g, ''))[0];
            historyData.unshift([parseInt(line.ts/1000), parseInt(line.LastPrice)]);
        }

    });
    */
};
