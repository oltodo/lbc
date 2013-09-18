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
            if(err) {
                return res.status(404).send(err);
            }

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
            if(err) {
                return res.status(404).send(err);
            }

            return res.send(cities);
        });
});

// Get searches
app.get('/ws/searches', function(req, res) {
    Search
        .find()
        .populate('cities', 'realName postcode')
        .exec(function(err, searches) {
            if(err) {
                return res.status(404).send(err);
            }

            return res.send(searches);
        });
});

// Get search
app.get('/ws/searches/:idSearch', function(req, res) {

    if(!req.params.idSearch) {
        return res.status(404).send('Search not found');
    }

    return Search
        .findById(req.params.idSearch)
        .populate('cities', 'realName postcode')
        .exec(function(err, search) {
            if(err) {
                return res.status(404).send(err);
            }

            return res.send(search);
        });
});

// Create search
app.post('/ws/searches', function(req, res) {

    var search = new Search(req.body).save(function(err) {
        if(err) {
            return res.status(404).send(err);
        }

        return search
            .populate('cities', 'realName postcode', function() {
                return res.send(search);
            });
    });
});

// Update search
app.post('/ws/searches/:idSearch', function(req, res) {

    if(!req.params.idSearch) {
        return res.status(404).send('Search not found');
    }

    var datas = req.body;

    return Search
        .findById(req.params.idSearch)
        .exec(function(err, search) {
            if(err) {
                return res.status(404).send(err);
            }
            
            search.title = datas.title;
            search.url = datas.url;
            search.photoOnly = datas.photoOnly;
            search.cities = [];

            for(var i in datas.cities) {
                search.cities.push(datas.cities[i]._id);
            }

            return search.save(function(err) {
                if(err) {
                    return res.status(404).send(err);
                }

                return search
                    .populate('cities', 'realName postcode', function() {
                        return res.send(search);
                    });
            });
        });
});



app.get('/ws/searches/:idSearch/ads', function(req, res) {

    if(!req.params.idSearch) {
        return res.status(404).send('Search not found');
    }

    return Search
        .findById(req.params.idSearch)
        .populate('cities', 'realName')
        .exec(function(err, search) {

            if(err) {
                return res.status(404).send(err);
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
                    if(err) {
                        return res.status(404).send(err);
                    }

                    return res.send(ads);
                });
        });
});


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port') + ' in '+app.get('env')+' mode');
});