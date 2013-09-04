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
        .otherwise({
            redirectTo: '/'
        });
    });
