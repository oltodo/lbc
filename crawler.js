var
    Crawler     = require('crawler').Crawler,
    mongoose    = require('mongoose'),
    trim        = require('trim'),
    Q           = require('q'),
    $           = require('jquery'),
    winston     = require('winston'),
    format      = require('date-format'),
    readline    = require('readline'),
    program     = require('commander'),
    MD5         = require('MD5'),
    express     = require('express'),
    app         = express(),

    // Models
    Ad          = require('./lib/models/ad'),
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



// process.on('uncaughtException', function (err) {
//     logger.error(err.stack);
// });


// Program command
program
    .version('0.0.1')
    .option('-i, --interactive', 'Prompt before to do somethings')
    .parse(process.argv)
;

if(typeof program.interactive == 'undefined') {
    program.interactive = false;
};


// var rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });







var delayBetweenUpdateSearch = 60; // minutes
var delayBetweenEachPage = [20,40]; // seconds

var months = {
    'janvier'   : 1,
    'février'   : 2,
    'mars'      : 3,
    'avril'     : 4,
    'mai'       : 5,
    'juin'      : 6,
    'juillet'   : 7,
    'août'      : 8,
    'septembre' : 9,
    'octobre'   : 10,
    'novembre'  : 11,
    'décembre'  : 12,
};

var rand = function (min, max) {
    var argc = arguments.length;
    
    if (argc === 0) {
        min = 0;
        max = 2147483647;
    } else if (argc === 1) {
        throw new Error('Warning: rand() expects exactly 2 parameters, 1 given');
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var fail = function (error) {
    logger.error(error.stack);
};



logger.info('Crawler start');


// Connect to the mongo database
logger.info('Connexion to database');

mongoose.connect('mongodb://localhost/lbc', function (err) {
    if(err) throw new Error(err);

    logger.info('Connexion successful');
    lauch();
});



var lauch = function () {

    getSearches()
        .then(checkSearches)
        .then(function () {
            logger.info('End, relaunching in one minute');
            setTimeout(lauch, 60000);
        })
        .fail(fail);

};

var checkSearches = function (searches) {
    var defer = Q.defer();
    var chain = Q.fcall(function () {});

    logger.info('Browsing searches');

    searches.forEach(function (search) {
        chain = chain.then(function () {
            return executeSearch(search);
        });
    });

    chain
        .then(defer.resolve)
        .fail(fail);

    return defer.promise;    
};

/**
 * Get searches
 * @return {Q.defer.promise} Return a promise
 */
var getSearches = function () { 
    var defer = Q.defer();

    logger.info('Loading searches');

    Search.find(function (err, searches) {

        logger.info(searches.length+' search(es) found');

        defer.resolve(searches);
    });

    return defer.promise; 
};

var executeSearch = function (search) {
    var defer = Q.defer();

    logger.info('Executing search `'+search.title+'`', {
        id: search._id.toString()
    })

    // Check if seach can be updated
    var diff = new Date()-search.updatedAt; // milliseconds
    diff = diff/1000/60; // minutes
    var remain = delayBetweenUpdateSearch-diff;

    if(remain <= 0) {
        logger.info('Search is ready to be updated');

        browsePages(search)
            .then(persistAds)
            .then(function() {
                return updateSearch(search);
            })
            .then(defer.resolve)
            .fail(fail);
    } else {
        logger.info('Search not ready to be updated');
        defer.resolve();
    }

    return defer.promise;    
};

var browsePages = function (search) { 
    var defer = Q.defer();
    var adsToBeSaved = [];

    var loadPage = function(url) {

        getContent(url)
            .then(extractDatas)
            .spread(function (nextPage, ads) {
                var cpt = 0;

                for(var i in ads) {
                    var ad = ads[i];

                    if(ad.nbPictures == 0 && search.photoOnly) {
                        continue;
                    }

                    if(ad.updatedAt <= search.updatedAt) {
                        nextPage = null;
                        break;
                    }

                    adsToBeSaved.push(ads[i]);
                    cpt++;
                }

                logger.info(cpt+' ad(s) found');

                if(nextPage) {
                    var delay = rand(delayBetweenEachPage[0], delayBetweenEachPage[1]);
                    
                    logger.info('Go to next page in '+delay+' seconds');

                    return setTimeout(function() {
                        loadPage(nextPage);
                    }, delay*1000);
                }

                defer.resolve(adsToBeSaved);
            })
            .fail(fail);
    };

    loadPage(search.url);

    return defer.promise;
};

/**
 * Get content from URL
 * @param  {String} url URL to load
 * @return {Q.defer.promise} Return a promise
 */
var getContent = function (url) { 
    var defer = Q.defer();

    logger.info('Loading content from', url);

    var c = new Crawler({
        maxConnections  : 2,
        forceUTF8       : true,
        jquery          : false,
        timeout         : 5000,
        callback        : function (err, result) {
            if(err) logger.error(err);
            else logger.info('Load successful', {
                md5: MD5(result.body)
            });

            defer.resolve(result.body);
        }
    }).queue(url);

    return defer.promise;  
};

var extractDatas = function (content) {
    var $content = $(content);

    logger.info('Extracting datas');

    return Q.all([
        extractNextPage($content),
        extractAds($content)
    ]);
};

var extractNextPage = function ($content) {
    var url = null;

    if(($paging = $content.find('#paging')).length) {
        var url = $paging.find('li.selected').next().find('a:first').attr('href');
    }

    return url;
};

var extractAds = function ($content) {
    var defer = Q.defer();
    var chain = [];

    $content.find('.list-lbc a .lbc').each(function () {
        var $this = $(this);

        chain.push(extractAd($this));
    });

    Q.all(chain)
        .then(function (ads) {
            defer.resolve(ads);
        })
        .fail(fail);

    return defer.promise;
};

var extractAd = function ($content) {

    // Find title
    var title = $content.find('.title').text();
    title = trim(title);

    // Find price
    var price = $content.find('.price').text();
    price = price.replace(/[^0-9]/g, '');
    price = parseInt(price);

    // Find city and department
    var placement = $content.find('.placement').text();
    placement = placement.split('/');

    var city = trim(placement[0]);
    var department = trim(placement[1] || '');


    // Find picture
    var $img = $content.find('.image img:first');
    var picture = $img.attr('data-original');

    if(picture === undefined || picture === '') {
        picture = $img.attr('src');
    }

    // Find url
    var url = $content.parent().attr('href');

    // Find uid
    var matches = url.match(/([0-9]+)\.htm/);

    if(!matches) {
        return false;
    }

    var uid = matches[1];

    // Find nb of pictures
    var nbPictures = $content.find('.nb .value').text();
    nbPictures = trim(nbPictures);
    nbPictures = parseInt(nbPictures);

    if(isNaN(nbPictures)) {
        nbPictures = 0;
    }


    // Find if is pro
    var category = $content.find('.category').text();
    var pro = /\(pro\)/.test(category);

    // Find publish date
    var day = trim($content.find('.date > div:first').text());
    var time = trim($content.find('.date > div:last').text());
    var updatedAt = new Date();

    // Define the day
    if(day == 'Aujourd\'hui') {
        // nothing to do...

    } else if(day == 'Hier') {
        updatedAt.setDate(updatedAt.getDate()-1);

    } else {
        day = day.split(' ');

        // Find the month number
        for(var i in months) {
            var re = new RegExp('^'+day[1]);

            if(re.test(i)) {
                updatedAt.setMonth(months[i]-1);
                break;
            }
        }

        updatedAt.setDate(day[0]);
    }

    // Define the time
    var time = time.split(':');
    updatedAt.setHours(time[0]);
    updatedAt.setMinutes(time[1]);
    updatedAt.setSeconds(0);

    return {
        uid: uid,
        title: title,
        price: price,
        city: city,
        department: department,
        url: url,
        picture: picture,
        nbPictures: nbPictures,
        pro: pro,
        updatedAt: updatedAt,
    };
};

var persistAds = function (ads) {
    var defer = Q.defer();

    if(ads.length == 0) {
        logger.info('Nothing to persist');
        defer.resolve();
    } else {
        logger.info('Persisting '+ads.length+' ads');

        var chain = Q.fcall(function () {});

        ads.forEach(function (ad) {
            chain = chain.then(function () {
                return persistAd(ad);
            });
        });

        chain
            .then(defer.resolve)
            .fail(fail);
    }

    return defer.promise;
};

var persistAd = function (datas) {
    var defer = Q.defer();

    logger.info('Trying to persist ad', {
        id: datas.uid,
        title: datas.title,
        city: datas.city
    });

    getAd(datas.uid)

        // Ad exists : update
        .then(function (ad) {
            logger.info('Ad already exists, updating...');

            for(var i in datas) {
                ad[i] = datas[i];
            }

            ad.save(function (err, ad) {
                if(err) {
                    logger.error(err);
                    defer.reject();
                } else {
                    logger.info('Update successful !');
                    defer.resolve();
                }

            });

        // Ad not exists : creation
        }, function () {
            logger.info('Ad not exists, creating...');

            new Ad(datas).save(function (err, ad) {
                if(err) {
                    logger.error(err);
                    defer.reject();
                } else {
                    logger.info('Creation successful !');
                    defer.resolve();
                }
            });
        })
        .fail(fail);

    return defer.promise;
};

var updateSearch = function(search) {
    var defer = Q.defer();

    logger.info('Updating date search... ', {
        id: search._id.toString()
    })

    search.updatedAt = new Date();
    search.save(function (err) {
        if(err) logger.error(err);
        else logger.info('Update successful');

        defer.resolve();
    });

    return defer.promise; 
};

/**
 * Get ad by his uid
 * @param  {String} uid Uid's ad
 * @return {Q.defer.promise} Return a promise
 */
var getAd = function (uid) {
    var defer = Q.defer();

    Ad.findOne({ uid: uid }, function (err, ad) {

        if(err || ad === null) {
            defer.reject();
            return;
        }

        defer.resolve(ad);
    });

    return defer.promise;
};
