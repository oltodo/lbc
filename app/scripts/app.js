/*global numeral:false */

'use strict';

angular.module('lbcApp', ['infinite-scroll'])
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
        .otherwise({
            redirectTo: '/'
        });
    })
    .filter('price', function() {
        return function(price) {
            return numeral(price).format('0,0[.]00 $');
        };
    });