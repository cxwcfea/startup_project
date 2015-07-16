'use strict';
var util = require('../lib/util'),
    mockTrader = require('../controllers/mockTrader');

var channelName = 'futures';
//var users

/*
function generateInitData(cb) {
    global.redis_client.lrange('mt://future/IFHIST', 0, 999, function(err, data) {
        if (err) {
            console.log(err.toString());
        }
        var ret = [];
        for (var i in data) {
            var line = data[i];
            line = JSON.parse(line.replace(/'/g, ''))[0];
            //console.log(JSON.parse(line));
            ret.push([line.ts/1000, parseFloat(line.LastPrice)]);
        }
        console.log(ret);
        cb(ret);
    });

    var data = [], time = (new Date()).getTime(), i;

    for (i = -999; i <= 0; i += 1) {
        data.push([
            time + i * 1000 * 60,
            util.getRandomInt(3600, 4000)
        ]);
    }
    return data;
}
     */

var historyData = [];

// Define the Socket.io configuration method
module.exports = function(io) {
    global.redis_client.lrange('mt://future/IFHIST', 0, 999, function(err, data) {
        if (err) {
            console.log(err.toString());
        }
        for (var i in data) {
            var line = data[i];
            line = JSON.parse(line.replace(/'/g, ''))[0];
            historyData.push([line.ts/1000, parseFloat(line.LastPrice)]);
        }

        io.on('connection', function(socket) {
            console.log(socket.id + ' connected');
            socket.on('join', function (name) {
                console.log(name + ' joined');
                generateInitData(function(data) {
                    socket.emit('history_data', data);
                });
            });
        });
        setInterval(function() {
            mockTrader.getLastFuturesPrice(function(err, data) {
                if (err) {
                    console.log('getLastFuturesPrice error:' + err.toString());
                    var x = (new Date()).getTime(), // current time
                        y = util.getRandomInt(3600, 4000);
                    historyData.push([x, y]);
                    io.sockets.emit('new_data', [x, y]);
                } else {
                    var x = data.ts, // current time
                        y = data.lastPrice;
                    historyData.push([x, y]);
                    io.sockets.emit('new_data', [x, y]);
                }
            });
        }, 30000);
    });
};
