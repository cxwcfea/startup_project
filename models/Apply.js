var mongoose = require('mongoose');

var applySchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    serialID: {type:String, unique: true, required:'{PATH} is required!'},
    amount: {type:Number, required:'{PATH} is required!'},
    deposit: {type:Number, required:'{PATH} is required!'},
    period: {type:Number, required:'{PATH} is required!'},
    status: {type:Number, required:'{PATH} is required!', default: 1}, // 1 means pending, 2 means proccessing, 3 means end, 4 means checking, 5 means failed
    applyAt: {type:Date, default: Date.now()},
    account: String,
    password: String
});

var Apply = mongoose.model('Apply', applySchema);

module.exports = Apply;
