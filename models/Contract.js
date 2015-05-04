var mongoose = require('mongoose');

var contractSchema = mongoose.Schema({
    applySerialID: {type:String, required:'{PATH} is required!'},
    amount: {type:Number, required:'{PATH} is required!'},
    status: {type:Number, default: 1}, // 0 wait for confirm, 1 pay success, 2 not pay, 3 otherwise
    investors: [String],
    startTime: Date,
    endTime: Date
});

var Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;