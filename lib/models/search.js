var mongoose = require('mongoose')
    Schema   = mongoose.Schema;

var SearchSchema = Schema({
    title: String,
    url: String,
    cities: [{ type: Schema.Types.ObjectId, ref: 'City' } ],
    updatedAt: Date,
    photoOnly: Boolean
});

module.exports = mongoose.model('Search', SearchSchema);