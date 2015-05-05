var mongoose = require('mongoose');

var contractSchema = mongoose.Schema({
    applySerialID: {type:String, required:'{PATH} is required!'},
    userMobile: {type:String, required:'{PATH} is required!'},
    amount: {type:Number, required:'{PATH} is required!'},
    status: {type:Number, default: 1}, // 0 reserve, 1 processing, 2 finished
    investors: [String],
    startTime: Date,
    endTime: Date
});

var Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;