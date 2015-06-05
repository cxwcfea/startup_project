var mongoose = require('mongoose');

var contractSchema = mongoose.Schema({
    applySerialID: {type:String, required:'{PATH} is required!'},
    userMobile: {type:String, required:'{PATH} is required!'},  // borrower mobile
    createdAt: {type:Date, default: Date.now},
    amount: {type:Number, required:'{PATH} is required!'},
    status: {type:Number, default: 1}, // 0 reserve, 1 processing, 2 finished
    period: {type:Number, required:'{PATH} is required!'},
    deposit: {type:Number, required:'{PATH} is required!'},    // the deposit for the related apply
    sellValue: {type:Number, required:'{PATH} is required!'},  // sell value for the realted apply
    createdAt: {type:Date, default: Date.now},
    investors: [{ uid: String, mobile: String, amount: Number, profitRate: Number }],
    totalProfit: Number,
    startTime: Date,
    endTime: Date,
    startAt: Date,
    closeAt: Date
});

var Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;