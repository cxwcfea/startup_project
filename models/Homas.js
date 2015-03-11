var mongoose = require('mongoose');

var homasSchema = mongoose.Schema({
    account: {type:String, unique: true, required:'{PATH} is required!'},
    password: {type:String, required:'{PATH} is required!'},
    applyID: String,
    using: {type:Boolean, default: false},
    assignAt:Date
});

var Homas = mongoose.model('Homas', homasSchema);

module.exports = Homas;
