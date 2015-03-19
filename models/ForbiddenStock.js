var mongoose = require('mongoose');

var forbiddenStockSchema = mongoose.Schema({
    stockID: {type:String, required:'{PATH} is required!'},
    stockName: {type:String, required:'{PATH} is required!'},
    date: {type:Date, default: Date.now()},
    description: {type:String, default: ''}
});

var ForbiddenStock = mongoose.model('ForbiddenStock', forbiddenStockSchema);

module.exports = ForbiddenStock;
