var mongoose = require('mongoose');

var searchSchema = mongoose.Schema({
    title: String,
    url: String,
    updatedAt: Date,
});

module.exports = mongoose.model('Search', searchSchema);