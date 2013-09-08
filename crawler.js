var
    Crawler     = require('crawler').Crawler,
    mongoose    = require('mongoose'),
    trim        = require('trim'),
    Q           = require('q'),
    $           = require('jquery'),
    clc         = require('cli-color');

// Models
var
    Ad          = require('./lib/models/ad'),
    Search      = require('./lib/models/search');




console.log('Connexion to database');

// Connect to the mongo database
mongoose.connect('mongodb://localhost/lbc');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
    console.log('Connected to database');

    getSearches()
        .then(browseSearches);
});



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

/**
 * Get searches
 * @return {Q.defer} Return a promise
 */
var getSearches = function () {
    console.log('Get searches');

    var deferred = Q.defer();

    Search.find(function(err, searches) {
        console.log(searches.length+' search(es) found');

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

    return function (searches) {
        var next = function() {
            if(++index == searches.length) {
                index = 0;
            }

            console.log();

            setTimeout(function() {
                browseSearches(searches);
            }, 2000);
        }

        console.log('Checking if search #'+index+' need to be updated');

        var search = searches[index];

        if(search.updatedAt == undefined) {
            search.updatedAt = new Date();
            search.save();
        }

        var diff = new Date()-search.updatedAt; // milliseconds
        diff = diff/1000/60; // minutes

        if(diff > 30) {
            console.log('Search #'+index+' need to be updated');

            executeSearch(search)
                .then(next);
        } else {
            console.log('Search #'+index+' don\'t need to be updated'); 
            next();
        }
    }; 
})(0);

var executeSearch = function (search) {
    var deferred = Q.defer();

    Q.fcall(executeUrl, search.url, [], search)
        .then(persistAds)
        .then(function (ads) {
            deferred.resolve();
        })
        .catch(function (err) {
            console.error(err);
        });

    return deferred.promise;
}

var executeUrl = (function () {
    var deferred = Q.defer();
    
    return function (url, adsToBeSaved, search) {

        console.log('Load '+clc.magenta(url));

        Q.fcall(loadContent, url)
            .then(extractDatasFromContent)
            .then(function (datas) {

                console.log(datas.ads.length+' ads found');

                for(var i in datas.ads) {
                    var ad = datas.ads[i];

                    if(ad.updatedAt <= search.updatedAt) {
                        deferred.resolve(adsToBeSaved);
                    }

                    adsToBeSaved.push(ad);
                }


                if(datas.nextPage) {
                    executeUrl(datas.nextPage, adsToBeSaved, search);
                } else {
                    deferred.resolve(adsToBeSaved);
                }
            })
            .catch(function (err) {
                console.error(err);
            });
        
        return deferred.promise;
    };
    
})();

var persistAds = function (ads) {
    var deferred = Q.defer();

    console.log(ads.length+' ads to be saved');

    var chain = Q.fcall(function () {});

    ads.forEach(function (ad) {
        chain = chain.then(function () {
            return persistAd(ad);
        });
    });

    chain.then(deferred.resolve);

    return deferred.promise;
};

var persistAd = function (datas) {
    var deferred = Q.defer();

    console.log('Trying to persist #'+datas.uid);

    getAd(datas.uid)

        // Ad exists : update
        .then(function (ad) {
            for(var i in datas) {
                ad[i] = datas[i];
            }

            ad.save(function (err, ad) {
                console.log('#'+ad.uid+' has been updated');
            });

            deferred.resolve();
        })

        // Ad not exists : creation
        .fail(function () {
            new Ad(datas).save(function (err, ad) {
                console.log('#'+ad.uid+' has been created');
            });

            deferred.resolve();
        });

    return deferred.promise;
};

var getAd = function (uid) {
    var deferred = Q.defer();

    Ad.findOne({ uid: uid }, function (err, ad) {

        if(err) {
            console.log('#'+uid+' not found in database');
            deferred.reject(err);
            return;
        }

        console.log('#'+uid+' already exists in database');
        deferred.resolve(ad);
    });

    return deferred.promise;
}

var loadContent = function (url) {
    var deferred = Q.defer();

    var c = new Crawler({
        maxConnections  : 2,
        forceUTF8       : true,
        jquery          : false,
        callback        : function (err, result) {
            if(err) {
                console.log('Loaded with fail');
                deferred.reject(err);
            } else {
                console.log('Loaded with success');
                deferred.resolve(result.body);
            }
        }
    }).queue(url);

    return deferred.promise;
};

/**
 * Extract ads from a content
 * @param  {String} content LBC list page content
 * @return {Q.promise}
 */
var extractDatasFromContent = function (content) {
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
        var department = trim(placement[1]);

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
