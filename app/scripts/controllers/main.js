'use strict';

angular.module('lbcApp')
    .controller('MainCtrl', function ($scope, $http, breadcrumbs) {
        $scope.search = null;
        
        breadcrumbs.clean().add({
            name: 'Toutes les recherches',
            path: '/'
        })

        $http.get('/ws/ads').success(function(data) {
            $scope.ads = data;
        });

        $http.get('/ws/search/5228f3c51bb0bc2b7aea9549').success(function(data) {
            $scope.search = data;
        });
    });
