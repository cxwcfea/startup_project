var redis = require("redis");

module.exports = function() {
    global.redis_client = redis.createClient();

    global.redis_client.on("error", function (err) {
        console.log("redis Error " + err);
    });

    global.redis_client.set("string key", "string val", redis.print);
};