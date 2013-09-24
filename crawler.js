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
    express     = require('express'),
    app         = express();

// Models
var
    Ad          = require('./lib/models/ad'),
    Search      = require('./lib/models/search');





// Configure logger
var logger = new (winston.Logger)({
    levels: {
        detail: 0,
        trace: 1,
        debug: 2,
        enter: 3,
        info: 4,
        success: 5,
        warn: 6,
        error: 7
    },
    colors: {
        detail: 'grey',
        trace: 'white',
        debug: 'white',
        enter: 'inverse',
        info: 'blue',
        success: 'green',
        warn: 'yellow',
        error: 'red'
    },
});

if(app.get('env') === 'development') {
    logger.add(winston.transports.Console, {
        colorize: true
    });
}

if(app.get('env') === 'production') {
    logger.add(winston.transports.File, {
        filename: './logs/crawler.log',
        json: false
    });
}

//logger.cli();



process.on('uncaughtException', function(err) {
    logger.error(err.toString());
});


// Program command
program
    .version('0.0.1')
    .option('-i, --interactive', 'Prompt before to do somethings')
    .parse(process.argv)
;

if(typeof program.interactive == 'undefined') {
    program.interactive = false;
}


var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});



// Connect to the mongo database
logger.info('Connexion to database... ');

mongoose.connect('mongodb://localhost/lbc', function (err) {
    if(err) throw new Error(err);

    logger.success('Connexion ok.');
    start();
});






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

var rand = function(min, max) {
    var argc = arguments.length;
    
    if (argc === 0) {
        min = 0;
        max = 2147483647;
    } else if (argc === 1) {
        throw new Error('Warning: rand() expects exactly 2 parameters, 1 given');
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var start = function () {
    logger.info('Crawling start');

    Q.fcall(getSearches)
        .then(browseSearches)
        .catch(function (err) {
            logger.error(err);
            throw new Error(err);
        });
};

/**
 * Get searches
 * @return {Q.defer.promise} Return a promise
 */
var getSearches = function () {
    logger.info('Loading searches... ');

    var deferred = Q.defer();

    Search.find(function(err, searches) {
        logger.info(searches.length+' searches found');

        deferred.resolve(searches);
    });

    return deferred.promise; 
}

/**
 * Browse each search every thirty minutes
 * @param  {array} searches Searches list
 * @return {void}
 */
var browseSearches = (function (index) {
    var firstTime = true;

    return function (searches) {

        if(firstTime) {
            logger.info('Waiting for a new search update...');
            firstTime = false;
        }

        var next = function() {

            if(++index == searches.length) {
                index = 0;
            }

            setTimeout(function() {
                browseSearches(searches);
            }, 2000);
        }

        var search = searches[index];

        if(search.updatedAt == undefined) {
            search.updatedAt = new Date();
            search.save();
        }

        var diff = new Date()-search.updatedAt; // milliseconds
        diff = diff/1000/60; // minutes
        var remain = delayBetweenUpdateSearch-diff;

        if(remain <= 0) {
            logger.info('Search "'+search.title+'" will be updated');

            executeSearch(searches)
                .then(function() {
                    firstTime = true;
                    next();
                });
        } else {
            next();
        }
    }; 
})(0);

var executeSearch = function (search) {
    var deferred = Q.defer();

    Q.fcall(executeUrl, search.url, [], search)
        .then(persistAds)
        .then(function (ads) {
            logger.info('Updating date search... ')

            search.updatedAt = new Date();
            search.save(function (err) {
                if(err) logger.error(err);
                else logger.info('Update successful');

                deferred.resolve();
            });
        })
        .catch(function (err) {
            logger.error(err);
            throw new Error(err);
        });

    return deferred.promise;
}

var executeUrl = (function () {
    var deferred = Q.defer();
    
    return function (url, adsToBeSaved, search) {

        logger.info('Load', url);

        Q.fcall(loadContent, url)
            .then(extractDatasFromContent)
            .then(function (datas) {
                logger.info(datas.ads.length+' ads found');

                // Reduce by comparing updated dates
                for(var i in datas.ads) {
                    var ad = datas.ads[i];

                    if(datas.nbPictures == 0 && search.photoOnly) {
                        continue;
                    }

                    if(ad.updatedAt <= search.updatedAt) {
                        deferred.resolve(adsToBeSaved);
                        return;
                    }

                    adsToBeSaved.push(ad);
                }

                // Go to next if necessary
                if(datas.nextPage) {
                    var delay = rand(delayBetweenEachPage[0], delayBetweenEachPage[1]);

                    logger.info('Go to next page');
                    logger.info('Waiting '+delay+' seconds...');

                    setTimeout(function() {
                        executeUrl(datas.nextPage, adsToBeSaved, search);
                    }, delay*1000);
                } else {
                    deferred.resolve(adsToBeSaved);
                }
            })
            .catch(function (err) {
                logger.error(err);
                throw new Error(err);
            });
        
        return deferred.promise;
    };    
})();

var loadContent = function (url) {
    var deferred = Q.defer();

    var c = new Crawler({
        maxConnections  : 2,
        forceUTF8       : true,
        jquery          : false,
        callback        : function (err, result) {
            if(err) {
                logger.error(err);
                deferred.reject(err);
            } else {
                logger.success('Success to load');
                deferred.resolve(result.body);
            }
        }
    }).queue(url);

    return deferred.promise;
};

var extractDatasFromContent = function (content) {
    logger.info('Extracting datas... ');

    var deferred = Q.defer();
    var $content = $(content);
    var ads = [];

    // Get next page URL
    var nextPage = null;

    if(($paging = $content.find('#paging')).length) {
        var nextPage = $paging.find('li.selected').next().find('a:first').attr('href');
    }

    // Get ads
    $content.find('.list-lbc a .lbc').each(function() {
        var $this = $(this);

        // Find title
        var title = $this.find('.title').text();
        title = trim(title);

        // Find price
        var price = $this.find('.price').text();
        price = price.replace(/[^0-9]/g, '');
        price = parseInt(price);

        // Find city and department
        var placement = $this.find('.placement').text();
        placement = placement.split('/');

        var city = trim(placement[0]);
        var department = trim(placement[1] || '');


        // Find picture
        var $img = $this.find('.image img:first');
        var picture = $img.attr('data-original');

        if(picture === undefined || picture === '') {
            picture = $img.attr('src');
        }

        // Find url
        var url = $this.parent().attr('href');

        // Find uid
        var matches = url.match(/([0-9]+)\.htm/);


        if(!matches) {
            return;
        }

        var uid = matches[1];

        // Find nb of pictures
        var nbPictures = $this.find('.nb .value').text();
        nbPictures = trim(nbPictures);
        nbPictures = parseInt(nbPictures);

        if(isNaN(nbPictures)) {
            nbPictures = 0;
        }


        // Find if is pro
        var category = $this.find('.category').text();
        var pro = /\(pro\)/.test(category);

        // Find publish date
        var day = trim($this.find('.date > div:first').text());
        var time = trim($this.find('.date > div:last').text());
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

        ads.push({
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
        });
    }).promise().then(function() {
        deferred.resolve({
            ads: ads,
            nextPage: nextPage
        });
    });

    return deferred.promise; 
};

var persistAds = function (ads) {
    var deferred = Q.defer();

    if(ads.length == 0) {
        logger.info('Nothing to persist');
        deferred.resolve();
    } else {
        logger.info('Persisting '+ads.length+' ads');

        var chain = Q.fcall(function () {});

        ads.forEach(function (ad) {
            chain = chain.then(function () {
                return persistAd(ad);
            });
        });

        chain.then(deferred.resolve);        
    }

    return deferred.promise;
};

var persistAd = function (datas) {
    var deferred = Q.defer();

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
                } else {
                    logger.success('Update successful !');
                }

                deferred.resolve();
            });

        // Ad not exists : creation
        }, function () {
            logger.info('Ad not exists, creating...');

            new Ad(datas).save(function (err, ad) {
                if(err) {
                    logger.error(err);
                } else {
                    logger.success('Creation successful !');
                }

                deferred.resolve();
            });
        })
        .catch(function (err) {
            logger.error(err);
            throw new Error(err);
        });

    return deferred.promise;
};


/**
 * Get ad by his uid
 * @param  {String} uid Uid's ad
 * @return {Q.promise} Return a promise
 */
var getAd = function (uid) {
    var deferred = Q.defer();

    Ad.findOne({ uid: uid }, function (err, ad) {

        if(err || ad === null) {
            deferred.reject();
            return;
        }

        deferred.resolve(ad);
    });

    return deferred.promise;
};
