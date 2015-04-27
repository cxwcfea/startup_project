var mongoose = require('mongoose');

var salesDataSchema = mongoose.Schema({
    userMobile: {type:String, required:'{PATH} is required!'},
    name: {type:String, required:'{PATH} is required!'},
    month: {type:String, required:'{PATH} is required!'},
    baseSalary: {type:Number, required:'{PATH} is required!'},
    profit: Number,
    newCustomers: [String],
    newPayCustomers: [String],
    customers: [String],
    loss: Number,
    complain: Number
});

var SalesData = mongoose.model('SalesData', salesDataSchema);

module.exports = SalesData;