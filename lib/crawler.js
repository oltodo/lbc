var
    Crawler     = require('crawler').Crawler,
    mongoose    = require('mongoose'),
    trim        = require('trim'),
    Q           = require('q'),
    $           = require('jquery'),
    winston     = require('winston'),
    base64      = require('base64'),
    express     = require('express'),
    app         = express(),

    utils       = require('./utils'),

    Ad          = require('./models/ad'),
    Search      = require('./models/search');


module.exports = (function() {

    var logger = new (winston.Logger)();

    var delayBetweenEachPage = [50,80]; // seconds

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

    var onFailed = function() {
        logger.error(error.stack);
    };

    var getMonthStringToInt = function(month) {

        // Find the month number
        for(var i in months) {
            var re = new RegExp('^'+month);

            if(re.test(i)) {
                return months[i]-1;
                break;
            }
        }       

        return 0;
    }

    var wait = function() {
        var defer = Q.defer();
        var delay = utils.rand(delayBetweenEachPage[0], delayBetweenEachPage[1]);
        
        logger.info('Waiting '+delay+'s...');

        setTimeout(defer.resolve, delay*1000);

        return defer.promise;
    }

    /**
     * Get searches
     * @return {Q.defer.promise} Return a promise
     */
    var getSearches = function () { 
        var defer = Q.defer();

        Search.find(function (err, searches) {
            defer.resolve(searches);
        });

        return defer.promise; 
    };

    /**
     * Get seach by his id
     * @return {Q.defer.promise} Return a promise
     */
    var getSearchById = function (id) { 
        var defer = Q.defer();

        Search.findById(id, function (err, search) {
            if(err) {
                defer.reject(err);
                return;
            }

            defer.resolve(search);
        });

        return defer.promise; 
    };

    var executeSearch = function (search) {
        var defer = Q.defer();

        logger.info('Executing search `'+search.title+'`', {
            id: search._id.toString()
        });

        var browseUrls = function () {
            var defer = Q.defer();
            var chain = Q.fcall(function () {});

            search.urls.forEach(function (url, i, urls) {
                chain = chain
                    .then(function() {
                        return browsePages(url);
                    })
                    .then(persistAds);

                if(i < urls.length-1) {
                    chain = chain.then(wait);
                }
            });

            chain
                .then(defer.resolve)
                .fail(onFailed);        

            return defer.promise;
        };

        var browsePages = function (url) { 
            var defer = Q.defer();
            var adsToBeSaved = [];

            var loadPage = function (url) {

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
                            }

                            adsToBeSaved.push(ads[i]);
                            cpt++;
                        }

                        logger.info(cpt+' ad(s) found');

                        if(nextPage) {
                            logger.info('Go to next page');

                            return wait()
                                .then(function () {
                                    loadPage(nextPage);
                                });
                        }

                        defer.resolve(adsToBeSaved);
                    })
                    .fail(function () {
                        defer.resolve(adsToBeSaved);
                    });
            };

            loadPage(url);

            return defer.promise;
        };


        browseUrls()
            .then(function () {
                return updateSearch(search);
            })
            .then(defer.resolve)
            .fail(onFailed);


        return defer.promise;   
    };


    var proxies = [];
    var currentProxy = 0;

    // hidemyass.com
    proxies.push({
        name: 'hidemyass.com',
        convert: function (url) {
            var base = 'http://7.hidemyass.com/ip-1/encoded/';

            url = url.replace(/^http/, '');
            return base+base64.encode(url);
        }
    });

    // node-unblocker.herokuapp.com
    proxies.push({
        name: 'node-unblocker.herokuapp.com',
        convert: function (url) {
            var base = 'https://node-unblocker.herokuapp.com/proxy/';
            return base+url;
        }
    });

    // longtax.com
    // proxies.push({
    //     name: 'longtax.com',
    //     convert: function (url) {
    //         var base = 'http://www.lontax.com/browse.php?b=20&u=';
    //         return base+encodeURIComponent(url);
    //     }
    // });

    // myairtools.net
    proxies.push({
        name: 'myairtools.net',
        convert: function (url) {
            var base = 'http://www.myairtools.net/browse.php?b=14&u=';
            return base+encodeURIComponent(url);
        }
    });

    // netproxy.pw
    proxies.push({
        name: 'netproxy.pw',
        convert: function (url) {
            var base = 'http://www.online.netproxy.pw/b.php?b=29&u=';
            return base+encodeURIComponent(url);
        }
    });

    /**
     * Get a proxy by name
     * @param  {String} name Proxy's name
     * @return {Object} Proxy
     */
    var getProxy = function (name) {
        for (var i in proxies) {
            var proxy = proxies[i];

            if(proxy.name == name) {
                return proxy;
            }
        }

        throw 'Proxy `'+name+'` not found';
    };

    /**
     * Get a random proxy
     * @return {Object} Proxy
     */
    var getRandProxy = function () {
        var key = utils.rand(0, proxies.length-1);
        key = 2;
        return proxies[key];
    };

    var getNextProxy = function () {
        if(currentProxy == proxies.length) {
            currentProxy = 0;
        }

        currentProxy++;
        return proxies[currentProxy-1];
    }

    /**
     * Get content from URL
     * @param  {String} url URL to load
     * @return {Q.defer.promise} Return a promise
     */
    var getContent = function (url, jquery, proxyName) {
        var defer = Q.defer();
        var counter = 0;
        var max = 3

        jquery = jquery || false;

        logger.info('Loading content from', url);

        var load = function () {

            var proxy = (proxyName ? getProxy(proxyName) : getNextProxy());

            logger.info('  -> Use proxy "'+proxy.name+'"');
            logger.info(proxy.convert(url));

            counter++;

            var c = new Crawler({
                maxConnections  : 2,
                forceUTF8       : true,
                jquery          : false,
                timeout         : 10000,
                cache           : false,
                skipDuplicates  : false,
                callback        : function (err, res) {
                    if(err) {
                        logger.error('Load failed');

                        switch(counter) {
                            case max:
                                defer.reject(err);
                                break;

                            default:
                                logger.info('Retry ('+counter+'/'+(max-1)+')')
                                load();
                        }

                        return;
                    }

                    logger.info('Load successful', {
                        md5: utils.md5(res.body)
                    });
    
                    defer.resolve(jquery ? $(res.body) : res.body);
                }
            }).queue(url);
        };

        load();

        return defer.promise;
    };

    var extractDatas = function (content) {
        var $content = $(content);

        logger.info('Extracting datas');

        return Q.all([
            extractNextPage($content),
            extractAdsFromListing($content)
        ]);
    };

    var extractNextPage = function ($content) {
        var url = null;

        if(($paging = $content.find('#paging')).length) {
            var url = $paging.find('li.selected').next().find('a:first').attr('href');
        }

        return url;
    };

    var extractAdsFromListing = function ($content) {
        var defer = Q.defer();
        var chain = [];

        $content.find('.list-lbc a .lbc').each(function () {
            var $this = $(this);

            chain.push(extractAdFromListing($this));
        });

        Q.all(chain)
            .then(function (ads) {
                defer.resolve(ads);
            })
            .fail(onFailed);

        return defer.promise;
    };

    var extractAdFromListing = function ($content) {

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

        picture = picture || '';
        picture = picture.replace('thumbs', 'images');

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

            updatedAt.setMonth(getMonthStringToInt(day[1]))
            updatedAt.setDate(day[0]);

            if(updatedAt.getTime() > Date.now()) {
                updatedAt.setFullYear(updatedAt.getFullYear()-1);
            }
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
            pictures: [picture],
            nbPictures: nbPictures,
            pro: pro,
            updatedAt: updatedAt,
            partial: true,
            deleted: false
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
                .fail(onFailed);
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

        getAdByUid(datas.uid)

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
            .fail(onFailed);

        return defer.promise;
    };

    var updateSearch = function (search) {
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
    var getAdByUid = function (uid) {
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

    /**
     * Get ad by id
     * @param  {String} uid Uid's ad
     * @return {Q.defer.promise} Return a promise
     */
    var getAd = function (id) {
        var defer = Q.defer();

        Ad.findById(id, function (err, ad) {

            if(err || ad === null) {
                defer.reject();
                return;
            }

            defer.resolve(ad);
        });

        return defer.promise;
    };

    var updateAd = function (ad) {
        var defer = Q.defer();

        getContent(ad.url, true)
            .then(extractAdFromDetail)
            .then(function(datas) {
                for(var i in datas) {
                    ad[i] = datas[i];
                }

                return persistAd(ad);
            })
            .fail(function(err) {
                switch(err.statusCode) {
                    case 404:
                        logger.error('Ad was deleted');
                        ad.deleted = true;
                        ad.partial = false;
                }

                return persistAd(ad);
            })
            .then(function() {
                defer.resolve(ad)
            })
            .fail(onFailed);

        return defer.promise;
    }

    var extractAdFromDetail = function ($content) {
        var defer = Q.defer();

        $content = $content.find('.lbcContainer:first');

        Q
            .all([
                extractAdTitleFromDetail($content),
                extractAdDescriptionFromDetail($content),
                extractAdParamsFromDetail($content),
                extractAdPicturesFromDetail($content),
                extractAdPhoneNumberFromDetail($content),
                extractAdDateFromDetail($content)
            ])
            .spread(function(title, description, params, pictures, phoneNumber, date) {
                var datas = $.extend({
                    title       : title,
                    description : description,
                    phoneNumber : phoneNumber,
                    partial     : false,
                    deleted     : false
                }, params);

                if(pictures.length) {
                    datas.pictures    = pictures;
                    datas.nbPictures  = pictures.length;
                }

                if(null !== date) {
                    datas.updatedAt = date;
                }

                defer.resolve(datas);
            })
            .fail(onFailed);

        return defer.promise;
    }

    var extractAdTitleFromDetail = function ($content) {
        var title = $content.find('#ad_subject').text();
        title = trim(title);
        return title;
    }

    var extractAdDescriptionFromDetail = function ($content) {
        var description = $content.find('.AdviewContent .content').html();
        description = description.replace(/\n/g, ' ');
        description = description.replace(/<br.*?>/g, "\n");
        description = trim(description);
        return description;
    }

    var extractAdPriceFromDetail = function ($content) {
        var price = $content.find('span.price').text();
        price = price.replace(/[^0-9]/g, '');
        price = parseInt(price);
        return price;
    }

    var extractAdPhoneNumberFromDetail = function ($content) {
        return $content.find('.lbcPhone img').attr('src');
    }

    var extractAdParamsFromDetail = function ($content) {
        var defer = Q.defer();
        var params = {};

        $content.find('.lbcParams tr').each(function() {
            var $this = $(this);
            
            var label =  $this.find('th').text();
            label = label.replace(':', '');
            label = trim(label);
            label = label.toLowerCase();
            label = label.replace(/\W+/g, '-');

            var value = $this.find('td').text()

            switch(label) {

                case 'prix':
                    params.price = value.replace(/[^0-9]/g, '');
                    params.price = parseInt(params.price);
                    break;

                case 'ville':
                    params.city = value;
                    break;

                case 'code-postal':
                    params.postcode = parseInt(value);
                    break;

                case 'pi-ces':
                    params.pieces = parseInt(value);
                    break;

                case 'type-de-bien':
                    switch(value) {
                        case 'Maison'       : params.type = 'house';        break;
                        case 'Appartement'  : params.type = 'apartment';    break;
                        case 'Terrain'      : params.type = 'land';         break;
                        case 'Parking'      : params.type = 'parking';      break;
                        default             : params.type = 'other';        break;
                    }

                    break;

                case 'surface':
                    params.surface = parseInt(value);
                    break;

                case 'ges':
                    var eir = trim(value);
                    eir = eir[0];

                    if(eir !== 'V') {
                        params.eir = eir;
                    }

                    break;

                case 'classe-nergie':
                    var eer = trim(value);
                    eer = eer[0];

                    if(eer !== 'V') {
                        params.eer = eer;
                    }

                    break;
            }

        }).promise().then(function() {
            defer.resolve(params);
        }).fail(onFailed);

        return defer.promise;
    }

    var extractAdPicturesFromDetail = function ($content) {
        var defer = Q.defer();
        var pictures = [];

        $content.find('#thumbs_carousel a span').each(function() {
            var bg = $(this).css('background-image');
            bg = trim(bg);

            var matches = bg.match(/^url\(.(.+).\)$/);

            bg = matches[1];
            bg = bg.replace('thumbs', 'images');

            pictures.push(bg);
        }).promise().then(function() {
            defer.resolve(pictures);
        }).fail(onFailed);

        return defer.promise;
    }

    var extractAdDateFromDetail = function ($content) {
        var str = $content.find('.upload_by').text();
        var matches;
        
        if(null !== (matches = str.match(/le ([0-9]+) (\S+) à ([0-9]+):([0-9]+)/))) {

            var day = matches[1];
            var month = getMonthStringToInt(matches[2]);
            var year = new Date().getFullYear();
            var hours = matches[3];
            var minutes = matches[4];
            var seconds = 0;

            return new Date(year, month, day, hours, minutes, seconds);
        }

        return null;
    }

    return {
        onFailed: onFailed,
        getSearchById: getSearchById,
        getSearches: getSearches,
        executeSearch: executeSearch,
        getContent: getContent,
        extractDatas: extractDatas,
        extractNextPage: extractNextPage,
        extractAdsFromListing: extractAdsFromListing,
        extractAdFromListing: extractAdFromListing,
        persistAds: persistAds,
        persistAd: persistAd,
        updateSearch: updateSearch,
        getProxy: getProxy,
        getRandProxy: getRandProxy,
        
        getAd: getAd,
        getAdByUid: getAdByUid,
        updateAd: updateAd,

        setLogger: function(l) {
            logger = l;
        }
    }

})();
