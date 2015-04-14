var mongoose = require('mongoose');

var alipayOrderSchema = mongoose.Schema({
    alipayAccount: {type:String, required:'{PATH} is required!'},
    amount: {type:Number, required:'{PATH} is required!'},
    transID: {type:String, required:'{PATH} is required!'},
    createdAt: {type:Date, default: Date.now},
    name: {type:String, required:'{PATH} is required!'}
});

var AlipayOrder = mongoose.model('AlipayOrder', alipayOrderSchema);

module.exports = AlipayOrder;