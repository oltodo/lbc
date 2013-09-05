var Crawler     = require('crawler').Crawler,
    fs          = require('fs'),
    mongoose    = require('mongoose'),
    trim        = require('trim'),
    Ad          = require('./lib/models/ad'),
    kue         = require('kue'),
    jobs        = kue.createQueue();


// Connect to the mongo database
mongoose.connect('mongodb://localhost/lbc');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    db.collections['ads'].drop();

    crawl();
});


// jobs.create('crawl', {
//     title: 'Crawl URL',
//     url: 'http://www.leboncoin.fr/ventes_immobilieres/offres/rhone_alpes/?f=a&th=1&pe=9&sqs=7&ros=3&ret=1&ret=2',
// }).save();


// jobs.process('crawl', function(job, done) {
//     console.log('foo');
// })

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
}

var crawl = function() {
    var c = new Crawler({
        maxConnections  : 10,
        forceUTF8       : true,
        callback        : function(error, result, $) {
            $('.list-lbc a .lbc').each(function() {
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

                if(picture === undefined) {
                    picture = $img.attr('src');
                }

                // Find url
                var url = $this.parent().attr('href');

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
                var date = new Date();

                // Define the day
                if(day == 'Aujourd\'hui') {
                    // nothing to do...

                } else if(day == 'Hier') {
                    date.setDate(date.getDate()-1);

                } else {
                    day = day.split(' ');

                    // Find the month number
                    for(var i in months) {
                        var re = new RegExp('^'+day[1]);

                        if(re.test(i)) {
                            date.setMonth(months[i]-1);
                            break;
                        }
                    }

                    date.setDate(day[0]);
                }

                // Define the time
                var time = time.split(':');
                date.setHours(time[0]);
                date.setMinutes(time[1]);
                date.setSeconds(0);


                // Create document
                var ad = new Ad({
                    title: title,
                    price: price,
                    city: city,
                    department: department,
                    url: url,
                    picture: picture,
                    nbPictures: nbPictures,
                    pro: pro,
                    publishedAt: date,
                });

                ad.save(function() {
                    console.log('+ '+title);
                });
            });
        }
    });

    //http://www.leboncoin.fr/ventes_immobilieres/offres/rhone_alpes/?f=a&th=1&pe=9&sqs=7&ros=3&ret=1&ret=2

    c.queue('http://localhost:3000/pages/page1.html');
}
