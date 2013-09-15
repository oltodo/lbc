var express     = require('express'),
    http        = require('http'),
    path        = require('path'),
    mongoose    = require('mongoose');

var Ad          = require('./lib/models/ad'),
    Search      = require('./lib/models/search'),
    City        = require('./lib/models/city');

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

app.configure('development', function() {
    app.use(express.static(path.join(__dirname, 'app')));
});

app.configure('production', function() {
    app.use(express.static(path.join(__dirname, 'dist')));
});

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}





var db = mongoose.connection;



// Search.findById('5228f3c51bb0bc2b7aea9549', function(err, search) {
    
//     City.findById('5231fce3a594324b602782ec', function(err, city) {
//         search.cities.push(city);
//         search.save();        
//     })
// });




// Get ads
app.get('/ws/ads', function(req, res) {

    return Ad.find({
            city: {
                $in: [
                    'Brindas', 'Charly', 'Chassagny', 'Chaussan', 'Craponne',
                    'Francheville', 'Grézieu-la-Varenne', 'Irigny', 'Millery',
                    'Montagny', 'Mornant', 'Orliénas', 'Oullins', 'Pierre-Bénite',
                    'Rontalon', 'Saint-André-la-Côte', 'Saint-Andéol-le-Château',
                    'Saint-Genis-Laval', 'Saint-Laurent-d\'Agny', 'Saint-Sorlin',
                    'Sainte-Foy-lès-Lyon', 'Soucieu-en-Jarrest', 'Taluyers',
                    'Tassin-la-Demi-Lune', 'Thurins', 'Vaugneray', 'Vernaison',
                    'Vourles'
                ]
            }
        })
        .sort('-updatedAt')
        .exec(function(err, ads) {
            return res.send(ads);
        });
})

// Get cities
app.get('/ws/cities', function(req, res) {
    var limit = req.params.limit || 10;
    var filters = {};

    if(req.query.q) {
        filters.realName = {
            $regex: req.query.q+'.*',
            $options: 'i'
        };
    }

    return City
        .find(filters)
        .limit(limit)
        .sort('-population')
        .exec(function(err, cities) {
            return res.send(cities);
        });
});



// Get search
app.get('/ws/search/:idSearch', function(req, res) {

    if(!req.params.idSearch) {
        res.statusCode = 404;
        return res.send('Error 404: No quote found');
    }

    return Search
        .findById(req.params.idSearch)
        .populate('cities', 'realName postcode')
        .exec(function(err, search) {
            return res.send(search);
        });
});

// Update search
app.put('/ws/search/:idSearch', function(req, res) {

    if(!req.params.idSearch) {
        res.statusCode = 404;
        return res.send('Error 404: No quote found');
    }

    var datas = req.body.search;

    return Search
        .findById(req.params.idSearch)
        .exec(function(err, search) {
            
            search.title = datas.title;
            search.url = datas.url;
            search.photoOnly = datas.photoOnly;
            search.cities = [];

            for(var i in datas.cities) {
                search.cities.push(datas.cities[i]._id);
            }

            return search.save(function(err) {
                return res.send(search);
            });
        });


    console.log(req.body);
})



app.get('/ws/search/:idSearch/ads', function(req, res) {

    if(!req.params.idSearch) {
        res.statusCode = 404;
        return res.send('Error 404: No quote found');
    }

    return Search
        .findById(req.params.idSearch)
        .populate('cities', 'realName')
        .exec(function(err, search) {

            if(err) {
                res.statusCode = 404;
                return res.send(err);
            }

            var cities = [];

            for(var i in search.cities) {
                cities.push(search.cities[i].realName);
            }

            return Ad.find({
                    city: { $in: cities }
                })
                .sort('-updatedAt')
                .exec(function(err, ads) {
                    return res.send(ads);
                });
        });
});





http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});


// var kue = require('kue');
// kue.app.listen(3001);