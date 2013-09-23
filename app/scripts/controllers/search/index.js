'use strict';

angular.module('lbcApp')
    .controller('SearchIndexCtrl', function (
        $scope, $routeParams, $http, $q, Search, breadcrumbs, $filter, SearchAds
    ) {
        breadcrumbs.clean();

        $scope.loading = false;
        $scope.page = 1;
        $scope.ads = [];

        var getSearch = (function() {
            var d = $q.defer();
            var search = null;

            return function() {
                if(null !== search) {
                    d.resolve(search);
                } else {
                    Search.get({ id: $routeParams.id }, function(s) {
                        search = s;
                        d.resolve(s);
                    });  
                }

                return d.promise;
            };
        })();

        getSearch()
            .then(function(search) {
                $scope.search = search;

                breadcrumbs.add({
                    name: search.title,
                    path: '/search/'+search._id
                });
            });
 
        $scope.more = function() {
            $scope.loading = true;

            getSearch()
                .then(function(search) {
                    SearchAds.query({
                        idSearch: '5228f3c51bb0bc2b7aea9549',
                        page: $scope.page
                    }, function(ads) {
                        for(var i in ads) {
                            $scope.ads.push(ads[i]);
                        }

                        $scope.page++;
                        $scope.loading = false;
                    });
                });
        }

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
