var express = require('express'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    Ad = require('./lib/models/ad');

var app = express();


// Connect to the mongo database
mongoose.connect('mongodb://localhost/lbc');


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'app')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}





var db = mongoose.connection;





app.get('/ws/ads', function(req, res) {

    return Ad.find({})
        .sort('-publishedAt')
        .exec(function(err, ads) {
            return res.send(ads);
        });
})



http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
