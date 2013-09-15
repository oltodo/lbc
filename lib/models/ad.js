var mongoose = require('mongoose');

var AdSchema = mongoose.Schema({
    uid: String,
    title: String,
    city: String,
    department: String,
    price: Number,
    url: String,
    picture: String,
    nbPictures: Number,
    pro: Boolean,
    publishedAt: { type: Date, default: null},
    updatedAt: Date,
    partial: { type: Boolean, default: true },
});

module.exports = mongoose.model('Ad', AdSchema);