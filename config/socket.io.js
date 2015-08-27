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
        name: 'ag',
        historyKey: 'mt://future/agHIST',
        currKey: 'mt://future/agCURR',
        historyData: []
    }
    /*
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
    },
    {
        name: 'BABA',
        historyKey: 'mt://stock/BABAHIST',
        currKey: 'mt://stock/BABA',
        historyData: []
    }
    */
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
                    if (cb) {
                        cb(err);
                    }
                    return;
                }
                var ret = [];
                var map = {};
                for (var i in data) {
                    var line = data[i];
                    line = JSON.parse(line.replace(/'/g, ''))[0];
                    var key = parseInt(line.ts/1000);
                    var value = Number(parseFloat(line.LastPrice).toPrecision(5));
                    if (!map[key]) {
                        map[key] = true;
                        if (index === 0) {
                            ret.unshift([key, value]);
                        } else {
                            ret.unshift([key, parseFloat(line.LastPrice)]);
                        }
                    }
                }
                products[index].historyData = ret;
                if (cb) {
                    cb(null, index);
                }
            });
        })();
    }
}

function fetchNewData(cb) {
    /*
    global.redis_client.get('mt://future/IFCURR', function(err, data) {
        var ret = null;
        if (!err) {
            data = JSON.parse(data);
            ret = [parseInt(data.ts/1000), parseInt(data.LastPrice)];
        }
        //console.log('current data:', parseInt(data.ts/1000) + ' ' + parseInt(data.LastPrice));
        cb(err, ret);
    });
    */
    for (var j = 0; j < products.length; ++j) {
        if (!products[j].historyData.length) {
            continue;
        }
        (function () {
            var index = j;
            global.redis_client.get(products[index].currKey, function(err, data) {
                var ret = null;
                if (!err) {
                    var historyData = products[index].historyData;
                    data = JSON.parse(data);
                    if (index === 0) {
                        var value = Number(parseFloat(data.LastPrice).toPrecision(5));
                        ret = [parseInt(data.ts/1000), value];
                    } else {
                        ret = [parseInt(data.ts/1000), parseFloat(data.LastPrice)];
                    }
                    if (ret[0] > historyData[historyData.length-1][0]) {
                        historyData.push(ret);
                    }
                }
                cb(err, ret, index);
            });
        })();
    }
}

// Define the Socket.io configuration method
module.exports = function(io) {
    fetchHistoryData();
    io.on('connection', function(socket) {
        console.log(socket.id + ' connected');
        socket.on('join', function (user) {
            console.log(user.name + ' joined room ' + user.room);
            socket.emit('history_data', {productID:user.room, data:products[user.room].historyData});
        });
        socket.on('getData', function (data) {
            fetchNewData(function(err, data, productIndex) {
                if (err) {
                    console.log(err.toString());
                    return;
                }
                socket.emit('new_data', {productID:productIndex, data:data});
            });
        });
    });
    setInterval(function() {
        fetchHistoryData(function(err, productIndex) {
            if (err) {
                console.log(err.toString());
                return;
            }
            io.sockets.emit('history_data', {productID:productIndex, data:products[productIndex].historyData});
        });
    }, 600000);
    setInterval(function() {
        fetchNewData(function(err, data, productIndex) {
            if (err) {
                console.log(err.toString());
                return;
            }
            io.sockets.emit('new_data', {productID:productIndex, data:data});
        });
    }, 8000);
};
