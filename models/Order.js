var mongoose = require('mongoose');

var orderSchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    userMobile: Number,
    userBalance: Number,
    createdAt: {type:Date, default: Date.now},
    dealType: {type:Number, required:'{PATH} is required!'}, // 1 充值， 2 提现， 3 盈提, 4 股票盈利, 5 保证金返还, 6 追加配资保证金, 7 追加管理费(延期), 8 管理费返还, 9 保证金支出, 10 管理费支出, 13 mgm 利润分成, 14 佣金兑换余额, 15 补穿仓
    amount: {type:Number, required:'{PATH} is required!'},
    status: {type:Number, default: 2}, // 0 wait for confirm, 1 pay success, 2 not pay, 3 otherwise, 5 special
    description: {type:String, required:'{PATH} is required!'},
    transID: String,
    cardInfo: {
        bank: String,
        bankName: String,
        cardID: String,
        province: String,
        city: String,
        userName: String
    },
    applySerialID: String,
    bankTransID: String, // only for dealType == 2,
    otherInfo: String,
    payType: Number,  // 0: iapppay, 1: shengpay, 2: apply, 3: alipay, 4: bank, 5: beifu, 6: commission, 7: niujin, 8: chuancang, undefine: withdraw
    approvedBy: String,
    approvedAt: {type:Date, default: 0},
    manager: String
});

var Order = mongoose.model('Order', orderSchema);

module.exports = Order;
