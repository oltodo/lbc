'use strict';

angular.module('lbcApp')
    .controller('SearchIndexCtrl', function ($scope, $routeParams, $http, Search, breadcrumbs, $filter) {
        breadcrumbs.clean();

        Search.get({ id: $routeParams.id }, function(search) {
            $scope.search = search;

            breadcrumbs.add({
                name: search.title,
                path: '/search/'+search._id
            });

            $http.get('/ws/searches/'+search._id+'/ads').success(function(data) {
                $scope.ads = data;
            });
        });


        $scope.growthIcon = function(ad) {
            if(ad.history.length <= 1) {
                return '';
            }

            var price1 = ad.history[ad.history.length-1].price;
            var price2 = ad.history[ad.history.length-2].price;

            if(price1 < price2) {
                var classs = 'icon-caret-down text-success';
            } else {
                var classs = 'icon-caret-up text-error';
            }

            var title = [];

            for(var i in ad.history) {
                title.push('- '+$filter('price')(ad.history[i].price));
            }

            return '<i class="'+classs+'" title="'+title.join("\n")+'"></i>';
        };
    });
