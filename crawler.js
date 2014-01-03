var
    mongoose    = require('mongoose'),
    Q           = require('q'),
    winston     = require('winston'),
    program     = require('commander'),
    express     = require('express'),
    app         = express(),

    crawler     = require('./lib/crawler'),
    utils       = require('./lib/utils'),
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
    .option('--test-proxy <proxy-name>', '')
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


    if(program.testProxy) {
        var url = 'http://www.leboncoin.fr/ventes_immobilieres/offres/rhone_alpes/rhone/?f=a&th=1&pe=10&sqs=7&ret=1&ret=2';

        crawler
            .getContent(url, true, program.testProxy)
            .then(crawler.extractDatas)
            .spread(function (nextPage, ads) {
                console.log(ads.length);
            });

        return;
    }

    lauch();
});

var sleepingHoursRange = [23,8];
var updateRunning = true;

var lauch = function () {

    var now = new Date();

    if(now.getHours() >= sleepingHoursRange[0] || now.getHours() < sleepingHoursRange[1]) {
        logger.info('I\'m sleeping');
        setTimeout(lauch, 60000);
        return;
    }

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
        var diff = Math.ceil(diff/1000); // seconds

        if(diff > (search.updateFrequency+utils.rand(0, 600))) {
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