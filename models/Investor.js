var mongoose = require('mongoose');

var investorSchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    userMobile: {type:String, required:'{PATH} is required!'},
    profitRate: {type:Number, required:'{PATH} is required!'},
    amount: {type:Number, required:'{PATH} is required!'},
    duration: {type:Number, required:'{PATH} is required!'},
    enable: {type:Boolean, required:'{PATH} is required!'},
    lastUpdate: Date
});

var Investor = mongoose.model('Investor', investorSchema);

module.exports = Investor;