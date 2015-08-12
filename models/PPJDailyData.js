var mongoose = require('mongoose');

var PPJDailyDataSchema = mongoose.Schema({
    userCount: {type:Number, required:'{PATH} is required!'},
    newUserCount: {type:Number, required:'{PATH} is required!'},
    winUserCount: {type:Number, required:'{PATH} is required!'},
    canAppointmentUserCount: {type:Number, required:'{PATH} is required!'},
    appointmentUserCount: {type:Number, required:'{PATH} is required!'},
    todayAppointmentCount: {type:Number, required:'{PATH} is required!'},
    totalProfit: {type:Number, required:'{PATH} is required!'},
    aveProfit: {type:Number, required:'{PATH} is required!'},
    totalHands: {type:Number, required:'{PATH} is required!'},
    date: {type:Date, default:Date.now}
});

var PPJDailyData = mongoose.model('PPJDailyData', PPJDailyDataSchema);

module.exports = PPJDailyData;