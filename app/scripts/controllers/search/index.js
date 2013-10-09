'use strict';

angular.module('lbcApp')
    .controller('SearchIndexCtrl', function (
        $scope, $routeParams, $http, $q, breadcrumbs, $filter,
        Search, Ad
    ) {
        breadcrumbs.clean();

        $scope.filter = 'all';
        $scope.loading = false;
        $scope.page = 1;
        $scope.limit = 30,
        $scope.ads = [];

        var getSearch = (function () {
            var d = $q.defer();
            var search = null;

            return function () {
                if(null !== search) {
                    d.resolve(search);
                } else {
                    Search.get({ id: $routeParams.id }, function (s) {
                        search = s;
                        d.resolve(s);
                    });  
                }

                return d.promise;
            };
        })();

        getSearch()
            .then(function (search) {
                $scope.search = search;

                breadcrumbs.add({
                    name: search.title,
                    path: '/search/'+search._id
                });
            });
 

        $scope.more = function () {
            $scope.loading = true;

            getSearch()
                .then(function (search) {
                    Ad.query({
                        idSearch: search._id,
                        page: $scope.page,
                        limit: $scope.limit,
                        ignored: $scope.filter == 'ignored',
                        followed: $scope.filter == 'followed',
                    }, function (ads) {
                        for(var i in ads) {
                            $scope.ads.push(ads[i]);
                        }

                        $scope.page++;
                        $scope.loading = ads.length < $scope.limit;
                    });
                });
        };

        $scope.$watch('filter', function(value, old) {
            if(value == old) {
                return;
            }

            $scope.ads = [];
            $scope.filter = value;
            $scope.page = 1
            $scope.more();
        });

        $scope.toggleIgnore = function (ad) {
            ad.ignored = !ad.ignored;
            ad.$update();
        };

        $scope.toggleFollow = function (ad) {
            ad.followed = !ad.followed;
            ad.$update();
        };

        $scope.growthIcon = function (ad) {
            if(ad.history.length <= 1) {
                return '';
            }

            var price1 = ad.history[ad.history.length-1].price;
            var price2 = ad.history[ad.history.length-2].price;

            if(price1 < price2) {
                var classs = 'icon-caret-down text-success';
            } else {
                var classs = 'icon-caret-up text-danger';
            }

            var title = [];

            for(var i in ad.history) {
                title.push('- '+$filter('price')(ad.history[i].price));
            }

            return '<i class="'+classs+'" title="'+title.join("\n")+'"></i>';
        };
    });
