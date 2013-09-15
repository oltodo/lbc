/*global numeral:false */

'use strict';

angular.module('lbcApp', [])
    .config(function ($routeProvider) {
        $routeProvider
        .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl'
        })
        .when('/ad/:id', {
            templateUrl: 'views/ad.html',
            controller: 'AdCtrl'
        })
        .when('/search/:id/edit', {
            templateUrl: 'views/search/edit.html',
            controller: 'SearchIndexCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
    })
    .config(["$httpProvider", function ($httpProvider) {
         $httpProvider.defaults.transformResponse.push(function(responseData){
            
            var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

            var convertDateStringsToDates = function(input) {
                // Ignore things that aren't objects.
                if (typeof input !== "object") return input;

                for (var key in input) {
                    if (!input.hasOwnProperty(key)) continue;

                    var value = input[key];
                    var match;
                    // Check for string properties which look like dates.
                    if (typeof value === "string" && (match = value.match(regexIso8601))) {
                        var milliseconds = Date.parse(match[0])
                        if (!isNaN(milliseconds)) {
                            input[key] = new Date(milliseconds);
                        }
                    } else if (typeof value === "object") {
                        // Recurse into object
                        convertDateStringsToDates(value);
                    }
                }
            };

            convertDateStringsToDates(responseData);

            return responseData;
        });
    }])
    .filter('price', function() {
        return function(price) {
            return numeral(price).format('0,0[.]00 $');
        };
    })
    .filter('prettyDate', function() {
        return function(date) {
            var m = moment(date);
            var diff = m.diff(new Date, 'days');
            var text = '';

            if(diff == -1) {
                text += 'Hier ';

            } else if(diff < -1) {
                text += m.format('D MMM')+' ';
            }

            return text+m.format('HH:MM');
        };
    });


angular.module('services.breadcrumbs', []);