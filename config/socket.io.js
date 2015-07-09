'use strict';
var util = require('../lib/util');

var channelName = 'futures';
//var users

function generateInitData() {
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
        var x = (new Date()).getTime(), // current time
            y = util.getRandomInt(3600, 4000);
        io.sockets.emit('new_data', [x, y]);
    }, 60000);
};