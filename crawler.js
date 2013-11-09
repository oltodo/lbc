var
    mongoose    = require('mongoose'),
    Q           = require('q'),
    winston     = require('winston'),
    program     = require('commander'),
    express     = require('express'),
    app         = express(),

    crawler     = require('./lib/crawler'),
    Search      = require('./lib/models/search');


// Configure Q promise
Q.longStackSupport = true;



// Configure logger
var logger = new (winston.Logger)();

if(app.get('env') === 'development') {
    logger.add(winston.transports.Console, {
        colorize: true
    });

    logger.cli();
};

if(app.get('env') === 'production') {
    logger.add(winston.transports.File, {
        filename: './logs/crawler.log',
        json: false
    });
};

logger.saveStackTrace = true;


// Program command
program
    .version('1.0.0')
    .option('--reload-ad <ad-id>', 'Crawl ad from leboncoin.fr and update it')
    .option('--execute-search <search-id>', '')
    .parse(process.argv)
;

var onFailed = function () {
    logger.error(error.stack);
};

logger.info('Crawler start');

// Connect to the mongo database
logger.info('Connexion to database');

mongoose.connect('mongodb://localhost/lbc', function (err) {
    if(err) throw new Error(err);

    logger.info('Connexion successful');

    crawler.setLogger(logger);

    if(program.reloadAd) {

        logger.info('Reloading ad #'+program.reloadAd);

        crawler.getAd(program.reloadAd)
            .then(crawler.updateAd)
            .then(function () {
                process.exit(1);
            });

        return;
    }

    if(program.executeSearch) {
        var id = program.executeSearch;

        crawler.getSearchById(id)
            .then(function(search) {
                return crawler.executeSearch(search);
            }, function(err) {
                logger.error('Search #'+id+' not found')
                process.exit();
            })
            .then(process.exit)
            .fail(onFailed);
            
        return;
    }

    lauch();
});

var updateRunning = true;

var lauch = function () {

    if(updateRunning) {
        logger.info('Waiting for a new search update');
        updateRunning = false;
    }

    crawler.getSearches()
        .then(checkSearches)
        .then(function () {
            if(updateRunning) {
                logger.info('End, relaunching in one minute');
            }

            setTimeout(lauch, 60000);
        })
        .fail(onFailed);
};

var checkSearches = function (searches) {
    var defer = Q.defer();
    var chain = Q.fcall(function () {});

    searches.forEach(function (search) {

        // Check if seach can be updated
        var diff = new Date()-search.updatedAt; // milliseconds
        var diff = Math.ceil(diff/1000);

        if(diff > search.updateFrequency) {
            chain = chain.then(function () {
                return crawler.executeSearch(search);
            });
        }
    });

    chain
        .then(function () {
            defer.resolve();
        })
        .fail(onFailed);

    return defer.promise;    
};