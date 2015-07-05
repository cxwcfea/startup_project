var mongoose = require('mongoose');

var applySchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    userMobile: Number,
    userName: String,
    userIdentity: String,
    serialID: {type:String, unique: true, required:'{PATH} is required!'},
    amount: {type:Number, required:'{PATH} is required!'},
    deposit: {type:Number, required:'{PATH} is required!'},
    period: {type:Number, required:'{PATH} is required!'},   // how long the apply will process, only count trade day
    status: {type:Number, required:'{PATH} is required!', default: 1}, // 1 means 待支付, 2 means 操盘, 3 means 已结算, 4 means 审核中, 5 means 结算中, 9 means special
    applyAt: {type:Date, default: Date.now},
    startAt: Date,
    closeAt: Date,
    isTrial: {type:Boolean, default: false},
    autoPostpone: Boolean,
    lever: {type:Number, default: 10},
    warnValue: Number,
    sellValue: Number,
    startTime: Date,
    endTime: Date,
    account: String,
    password: String,
    profit: Number,
    orderID: String,
    type: {type:Number, default: 1},  // 1 means ttn, 2 means yyn
    interestRate: Number, // for month
    serviceCharge: Number,  // for day
    discount: Number,  // for day
    manager: String,
    contractID: String,
    actualServiceFee: Number,
    profitForMgm: {type:Number, default: 0},
    profitForInvest: {type:Number, default: 0},  // how much profit will return to investor
    accountType: Number,  // 2 means tonghuashun, otherwise means homs
    userCloseAt: Date,
    freeDays: Number
});

var Apply = mongoose.model('Apply', applySchema);

module.exports = Apply;
