var mongoose = require('mongoose');

var PPJResetRecordSchema = mongoose.Schema({
    userData: {
        cash: { type: Number, required:'{PATH} is required!' },
        status: { type: Number, required:'{PATH} is required!' },
        lastCash: { type: Number, required:'{PATH} is required!' }
    },
    positions: {
        quantity: { type: Number, required:'{PATH} is required!' },
        longQuantity: { type: Number, required:'{PATH} is required!' },
        shortQuantity: { type: Number, required:'{PATH} is required!' },
        fee: { type: Number, required:'{PATH} is required!' },
        total_deposit: { type: Number, required:'{PATH} is required!' },
        total_point: { type: Number, required:'{PATH} is required!' }
    },
    userId: { type: String, required:'{PATH} is required!' },
    date: {type:Date, default:Date.now}
});

var PPJResetRecord = mongoose.model('PPJResetRecord', PPJResetRecordSchema);

module.exports = PPJResetRecord;