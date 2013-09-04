var mongoose = require('mongoose');

var adSchema = mongoose.Schema({
    title: String,
    city: String,
    department: String,
    price: Number,
    url: String,
    picture: String,
    nbPictures: Number,
    pro: Boolean,
    publishedAt: Date,
    partial: { type: Boolean, default: true },
});

module.exports = mongoose.model('Ad', adSchema);