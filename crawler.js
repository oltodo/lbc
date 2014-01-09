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

crawler.setLogger(logger);


var onFailed = function () {
    logger.error(error.stack);
};


var connect = function() {
    var defer = Q.defer();

    logger.info('Connexion to database');

    mongoose.connect('mongodb://localhost/lbc', function (err) {
        if(err) {
            logger.info('Connexion fail: '+err);
            throw new Error(err);
        }

        logger.info('Connexion successful');
        defer.resolve();
    });

    return defer.promise;
};


var executeStart = function()
{
    logger.info('Crawler start');

    connect()
        .then(function() {
            launch();
        });
};

var executeTestProxy = function(cmd)
{
    var
        http  = require('http'),
        url   = require('url'),
        urlDatas = url.parse(cmd.url);

    var req = http.get({
        host: cmd.host,
        port: cmd.port,
        path: cmd.url,
        headers: {
            'Host': urlDatas.host,
            'User-Agent': 'Mozilla/1.22 (compatible; MSIE 5.01; PalmOS 3.0) EudoraWeb 2'
        }
    } , function(res) {
        logger.info('STATUS: ' + res.statusCode);
        logger.info('HEADERS: ' + JSON.stringify(res.headers));

        res.on('data', function (chunk) {
            logger.info('BODY: ' + chunk);
        });

        res.on('end', function () {
            console.log('Finished');
        });
    });

    req.setTimeout(cmd.timeout*1000, function() {
        logger.error('Timeout');
        req.abort();
    });

    req.on('error', function(e) {
        logger.error("Got error: " + e.message);
    });
};


var executeReloadAd = function(cmd)
{
    logger.info('Reloading ad #'+program.reloadAd);

    crawler.getAd(program.reloadAd)
        .then(crawler.updateAd)
        .then(function () {
            process.exit(1);
        });
}

var executeSearch = function(cmd)
{
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
}


// Program command
program
    .version('1.0.0')
    .option('--toto', 'Toto')
;

program
    .command('reload-ad <ad-id>')
    .description('Crawl ad from leboncoin.fr and update it')
    .action(function(cmd) {
        executeReloadAd(cmd);
    });

program
    .command('execute-search <search-id>')
    .description('Execute a specific search')
    .action(function(cmd) {
        executeSearch(cmd);
    });

program
    .command('test-proxy')
    .description('Test a proxy')
    .option('-h, --host <host>', 'Proxy\'s host')
    .option('-p, --port <port>', 'Proxy\'s port (default: 80)', 80)
    .option('-u, --url <url>', 'Url to test (default: http://www.google.com/)', 'http://www.google.com/')
    .option('--timeout <timeout>', 'Timeout in second (default: 10s)', 10)
    .action(function(cmd) {
        executeTestProxy(cmd);
    })
;

program
    .command('start')
    .description('Start crawling')
    .action(function(cmd) {
        executeStart(cmd);
    });
;

program
    .parse(process.argv);




var sleepingHoursRange = [23,8];
var updateRunning = true;

var launch = function () {

    var now = new Date();

    if(now.getHours() >= sleepingHoursRange[0] || now.getHours() < sleepingHoursRange[1]) {
        logger.info('I\'m sleeping');
        setTimeout(launch, 60000);
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

            setTimeout(launch, 60000);
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