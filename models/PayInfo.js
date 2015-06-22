var mongoose = require('mongoose');

var payInfoSchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    mobile: {type:String, required:'{PATH} is required!'},
    certNo: {type:String, required:'{PATH} is required!'},
    bankCode: {type:String, required:'{PATH} is required!'},
    cardID: {type:String, required:'{PATH} is required!'},
    userName: {type:String, required:'{PATH} is required!'},
    cardLast: String, // for yeepay
    cardTop: String,  // for yeepay
    infoType: {type:Number, default:1}  // 1 means beifu info, 2 means yeepay info
});

var PayInfo = mongoose.model('PayInfo', payInfoSchema);

module.exports = PayInfo;