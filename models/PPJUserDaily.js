var mongoose = require('mongoose');

var PPJUserDailySchema = mongoose.Schema({
    userId: {type:Number, required:'{PATH} is required!'},
    wechat_uuid: {type:String, required:'{PATH} is required!'},
    hands: {type:Number, required:'{PATH} is required!'},
    profit: {type:Number, required:'{PATH} is required!'},
    date: {type:Date, default:Date.now}
});

var PPJUserDaily = mongoose.model('PPJUserDaily', PPJUserDailySchema);

module.exports = PPJUserDaily;