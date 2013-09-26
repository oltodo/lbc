var mongoose = require('mongoose')
    Schema   = mongoose.Schema;

var SearchSchema = Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    cities: [{ type: Schema.Types.ObjectId, ref: 'City' } ],
    updatedAt: Date,
    updateFrequency: { type: Number, default: 3600 },
    photoOnly: Boolean
});

var Search = mongoose.model('Search', SearchSchema);

Search.schema.path('url').validate(function(value) {
    return /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/.test(value);
}, 'Invalid URL');

module.exports = Search;