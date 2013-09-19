var mongoose = require('mongoose');

var AdSchema = mongoose.Schema({
    uid: String,
    title: String,
    city: String,
    department: String,
    price: Number,
    history: [{
        price: Number,
        date: Date
    }],
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

AdSchema.pre('save', function(next) {

    var getLastPrice = function(ad) {
        if(ad.history.length === 0) {
            return -1;
        }

        return ad.history[ad.history.length-1].price;
    }

    if(getLastPrice(this) !== this.price) {
        this.history.push({
            price: this.price,
            date: this.updatedAt
        })
    }

    next();
});

module.exports = mongoose.model('Ad', AdSchema);