var mongoose = require('mongoose');

var orderSchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    createdAt: {type:Date, default: Date.now()},
    dealType: {type:String, required:'{PATH} is required!'},
    amount: {type:Number, required:'{PATH} is required!'},
    status: {type:Boolean, default: false},
    description: {type:String, required:'{PATH} is required!'}
});

var Order = mongoose.model('Order', orderSchema);

module.exports = Order;
