var mongoose = require('mongoose');

var orderSchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    createdAt: {type:Date, default: Date.now()},
    dealType: {type:String, required:'{PATH} is required!'},
    amount: {type:Number, required:'{PATH} is required!'},
    status: {type:Number, default: 0}, // 0 not pay, 1 pay success, 2 otherwise
    description: {type:String, required:'{PATH} is required!'},
    transID: String,
    cardInfo: {
        bankName: String,
        cardID: Number,
        userName: String
    }
});

var Order = mongoose.model('Order', orderSchema);

module.exports = Order;
