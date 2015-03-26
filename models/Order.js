var mongoose = require('mongoose');

var orderSchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    userMobile: Number,
    createdAt: {type:Date, default: Date.now()},
    dealType: {type:Number, required:'{PATH} is required!'}, // 1 充值， 2 提现， 3 盈提, 4 股票盈利, 5 保证金返还, 6 追加配资保证金, 7 配资延期, 8 管理费返还
    amount: {type:Number, required:'{PATH} is required!'},
    status: {type:Number, default: 2}, // 0 wait for confirm, 1 pay success, 2 not pay, 3 otherwise
    description: {type:String, required:'{PATH} is required!'},
    transID: String,
    cardInfo: {
        bank: String,
        bankName: String,
        cardID: Number,
        userName: String
    },
    applySerialID: String,
    bankTransID: String, // only for dealType == 2,
    otherInfo: String,
    payType: Number  // 0 means iapppay, 1 means shengpay, 2 means from apply, 3 means alipay transfer, undefine means withdraw
});

var Order = mongoose.model('Order', orderSchema);

module.exports = Order;
