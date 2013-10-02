var mongoose = require('mongoose');

var AdSchema = mongoose.Schema({
    uid         : String,
    title       : String,
    description : String,
    city        : String,
    department  : String,
    postcode    : String,
    price       : Number,
    surface     : Number,
    pieces      : Number,
    type        : {
        type    : String,
        enum    : ['house', 'apartment', 'parking', 'land', 'other'],
        default : 'other'
    },
    eer         : String, // Classe énergie
    eir         : String, // GES
    history: [{
        price   : Number,
        date    : Date
    }],
    url         : String,
    picture     : String,
    nbPictures  : Number,
    pictures    : [String],
    pro         : Boolean,
    phoneNumber : String,
    publishedAt : { type: Date, default: null},
    createdAt   : { type: Date, default: null },
    updatedAt   : { type: Date, default: null },
    partial     : { type: Boolean, default: true },
    ignored     : { type: Boolean, default: false },
    deleted     : { type: Boolean, default: false }
});

AdSchema.pre('save', function(next) {

    if(this.createdAt === null) {
        this.createdAt = this.updatedAt;
    }

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