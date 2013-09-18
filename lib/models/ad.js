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
    createdAt: { type: Date, default: null },
    updatedAt: { type: Date, default: null },
    partial: { type: Boolean, default: true },
});

AdSchema.post('init', function(ad) {
    if(ad.createdAt === null) {
        ad.createdAt = ad.updatedAt;
    }
});

module.exports = mongoose.model('Ad', AdSchema);