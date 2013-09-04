'use strict';

angular.module('lbcApp')
    .controller('MainCtrl', function ($scope, $http) {
        $http.get('/ws/ads').success(function(data) {
            $scope.ads = data;
        })
    });
