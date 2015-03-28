var mongoose = require('mongoose');

var cardSchema = mongoose.Schema({
    userID: {type:String, required:'{PATH} is required!'},
    bankID: {type:Number, required:'{PATH} is required!'},
    bankName: {type:String, required:'{PATH} is required!'},
    cardID: {type:String, required:'{PATH} is required!'},
    userName: {type:String, required:'{PATH} is required!'}
});

var Card = mongoose.model('Card', cardSchema);

module.exports = Card;
