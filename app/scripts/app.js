/*global numeral:false */

'use strict';

var app = angular.module('lbcApp', [
    'resources.searches',
    'services.breadcrumbs',
    'ngSanitize',
    'infinite-scroll'
]);

app.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl'
        })
        .when('/ad/:id', {
            templateUrl: 'views/ad.html',
            controller: 'AdCtrl'
        })
        .when('/search/new', {
            templateUrl: 'views/search/edit.html',
            controller: 'SearchEditCtrl'
        })
        .when('/search/:id/edit', {
            templateUrl: 'views/search/edit.html',
            controller: 'SearchEditCtrl'
        })
        .when('/search/:id', {
            templateUrl: 'views/search/index.html',
            controller: 'SearchIndexCtrl'
        })
        .when('/search/:idSearch/ad/:id', {
            templateUrl: 'views/ad.html',
            controller: 'AdCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
});

app.config(["$httpProvider", function ($httpProvider) {
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
}]);

app.filter('price', function() {
    return function(price) {
        return numeral(price).format('0,0[.]00 $');
    };
});

app.filter('prettyDate', function() {
    return function(date) {
        var date = moment(date);
        var yesterday = moment().subtract('days', 1);
        var text = '';

        if(date.format('YYYYMMDD') === yesterday.format('YYYYMMDD')) {
            text += 'Hier ';

        } else if(date.format('YYYYMMDD') < yesterday.format('YYYYMMDD')) {
            text += date.format('D MMM')+' ';
        }

        return text+date.format('HH:mm');
    };
});

app.filter('nl2br', function() {
    return function(string, is_xhtml) { 
        var is_xhtml = is_xhtml || true;
        var breakTag = (is_xhtml) ? '<br />' : '<br>';    
        var text = (string + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
        return text;
    };
});

app.run(function($rootScope) {
    $rootScope.$on('$routeChangeSuccess', function(ev, data) {   
        if (data.$$route && data.$$route.controller) {
            $rootScope.id = data.$$route.controller;
            $rootScope.id = $rootScope.id.replace(/Ctrl$/, '');
            $rootScope.id = $rootScope.id.replace(/(\w)([A-Z])/g, '$1-$2');
            $rootScope.id = $rootScope.id.toLowerCase();
        }
    })
});

angular.module('services.breadcrumbs', [])
    .factory('breadcrumbs', function($rootScope, $location) {
        var breadcrumbs = [];
        var breadcrumbsService = {};

        breadcrumbsService.add = function(datas) {
            breadcrumbs.push(datas);
            return this;
        };

        breadcrumbsService.clean = function() {
            breadcrumbs = [];
            return this;
        };

        breadcrumbsService.getAll = function() {
            return breadcrumbs;
        };

        breadcrumbsService.getFirst = function() {
            return breadcrumbs[0] || {};
        };

        return breadcrumbsService;
    });




angular.module('resources.searches', ['ngResource'])
    .factory('Search', function($resource) {
        return $resource('/ws/searches/:id', {
            id: '@_id'
        });
    })
    .factory('Ad', function($resource) {
        return $resource('/ws/ads/:id', {
            id: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        });
    })
    .factory('SearchAds', function($resource) {
        return $resource('/ws/searches/:idSearch/ads')
    });