'use strict';
var util = require('../lib/util'),
    mockTrader = require('../controllers/mockTrader');

var channelName = 'futures';
//var users

function generateInitData() {
    global.redis_client.lrange('mt://future/IFHIST', 0, 999, function(err, data) {
        if (err) {
            console.log(err.toString());
        }
        console.log(typeof data);
        for (var i in data) {
            var line = data[i];
            console.log(typeof line);
        }
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

// Define the Socket.io configuration method
module.exports = function(io) {
    io.on('connection', function(socket) {
        console.log(socket.id + ' connected');
        socket.on('join', function (name) {
            console.log(name + ' joined');
            socket.emit('history_data', generateInitData());
        });
    });
    setInterval(function() {
        mockTrader.getLastFuturesPrice(function(err, data) {
            if (err) {
                console.log('getLastFuturesPrice error:' + err.toString());
                var x = (new Date()).getTime(), // current time
                    y = util.getRandomInt(3600, 4000);
                io.sockets.emit('new_data', [x, y]);
            } else {
                var x = data.ts, // current time
                    y = data.lastPrice;
                io.sockets.emit('new_data', [x, y]);
            }
        });
    }, 30000);
};
