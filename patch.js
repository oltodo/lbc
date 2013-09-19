var 
    mongoose    = require('mongoose'),
    Ad          = require('./lib/models/ad');


mongoose.connect('mongodb://localhost/lbc');


Ad.find(function(err, ads) {

    for(var i in ads) {
        var ad = ads[i];

        if(ad.history.length === 0) {
            ad.history.push({
                price: ad.price,
                date: ad.createdAt
            });

            ad.save(function(err) {
                if(err)
                    console.log('uid='+ad.uid, err);

                if(i == ads.length) {
                    console.log('Finished');
                }
            });
        }

    }
});