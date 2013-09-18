/*global numeral:false */

'use strict';

var app = angular.module('lbcApp', [
    'resources.searches',
    'services.breadcrumbs'
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
    });