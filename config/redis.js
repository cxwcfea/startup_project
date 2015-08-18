var redis = require("redis");

module.exports = function() {
    console.log('redis run');
    global.redis_client = redis.createClient();

    global.redis_client.on("error", function (err) {
        console.log("redis Error " + err);
    });
};
