'use strict';

angular.module('lbcApp')
    .controller('SearchIndexCtrl', function ($scope, $routeParams, $http, Search, breadcrumbs) {
        breadcrumbs.clean();

        Search.get({ id: $routeParams.id }, function(search) {
            $scope.search = search;

            breadcrumbs.add({
                name: search.title,
                path: '/search/'+search._id
            });
        });

        $http.get('/ws/ads').success(function(data) {
            $scope.ads = data;
        });

        $http.get('/ws/searches/'+$routeParams.id).success(function(data) {
            $scope.search = data;
        });
    });
