var mongoose = require('mongoose');

var dailyDataSchema = mongoose.Schema({
    applyAmount: {type:Number, required:'{PATH} is required!'},
    applyNum: {type:Number, required:'{PATH} is required!'},
    income: {type:Number, required:'{PATH} is required!'},
    newUsers: {type:Number, required:'{PATH} is required!'},
    date: {type:String, required:'{PATH} is required!'}
});

var DailyData = mongoose.model('DailyData', dailyDataSchema);

module.exports = DailyData;