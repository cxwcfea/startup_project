var mongoose = require('mongoose');

var noteSchema = mongoose.Schema({
    userMobile: {type:String, required:'{PATH} is required!'},
    title: String,
    tag: String,
    content: String,
    createdAt: {type:Date, default: Date.now},
    writer: {type:String, required:'{PATH} is required!'}
});

var Note = mongoose.model('Note', noteSchema);

module.exports = Note;