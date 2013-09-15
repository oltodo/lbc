var mongoose = require('mongoose');

var CitySchema = mongoose.Schema({
    amdi : Number,
    canton : Number,
    commune : Number,
    dept : String,
    district : Number,
    latitude_dms : Number,
    latitude_grd : Number,
    longitude_dms : Number,
    longitude_grd : Number,
    name : String,
    population : Number,
    postcode : String,
    realName : String,
    surface : Number,
    zmax : Number,
    zmin : Number
});

module.exports = mongoose.model('City', CitySchema);