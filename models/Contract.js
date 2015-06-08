var mongoose = require('mongoose');

var contractSchema = mongoose.Schema({
    applySerialID: {type:String, required:'{PATH} is required!'},
    userMobile: {type:String, required:'{PATH} is required!'},  // borrower mobile
    createdAt: {type:Date, default: Date.now},
    amount: {type:Number, required:'{PATH} is required!'},
    platformAmount: {type:Number, default: 0},  // amount which not from investor but from niujin
    status: {type:Number, default: 1}, // 0 reserve, 1 processing, 2 finished
    period: {type:Number, required:'{PATH} is required!'}, // how long the apply will process, count by natural days
    deposit: {type:Number, required:'{PATH} is required!'},    // the deposit for the related apply
    sellValue: {type:Number, required:'{PATH} is required!'},  // sell value for the realted apply
    investors: [{ uid: String, mobile: String, name: String, id: String, amount: Number, profitRate: Number }],
    totalProfit: Number,    // how much profit this contract generate after it complete
    startTime: Date,   // the startTime of related apply
    endTime: Date,     // the endTime of related apply
    startAt: Date,     // the time when the contract change to processing
    closeAt: Date     // the time when the contract change to finished
});

var Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;