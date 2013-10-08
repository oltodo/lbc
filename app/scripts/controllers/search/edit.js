'use strict';

angular.module('lbcApp')
    .controller('SearchEditCtrl', function ($scope, Search, $routeParams, $http, breadcrumbs) {
        breadcrumbs.clean();

        $scope.urls = [];

        if(!$routeParams.id) {

            $scope.search = new Search();
            $scope.search.cities = [];
            $scope.addUrl('');

            breadcrumbs.add({
                name: 'Nouvelle recherche',
                path: '/search/new'
            });
        } else {

            Search.get({ id: $routeParams.id }, function(search) {
                $scope.search = search;

                if($scope.search.urls.length === 0) {
                    $scope.addUrl('');
                } else {
                    for(var i in search.urls) {
                        $scope.addUrl(search.urls[i]);
                    }
                }

                breadcrumbs.add({
                    name: search.title,
                    path: '/search/'+search._id
                });

                breadcrumbs.add({
                    name: 'Edition',
                    path: '/search/'+search._id+'/edit'
                });
            });
        }

        $scope.addCity = function(city) {
            if(this.cityExists(city)) {
                return;
            }

            this.search.cities.push(city);
            this.$apply();
        };

        $scope.removeCity = function(city) {
            var i;

            if((i = this.cityExists(city)) !== false) {
                this.search.cities.splice(i, 1);
            }
        };

        // Return false or index
        $scope.cityExists = function(city) {
            var cities = this.search.cities;

            for(var i in cities) {
                if(cities[i]._id == city._id) {
                    return i;
                }
            }   

            return false;
        };

        $scope.addUrl = function(url) {
            $scope.urls.push({ link: url })
        };

        $scope.removeUrl = function(index) {
            if($scope.urls.length < 2 || index >= $scope.urls.length) {
               return; 
            }

            $scope.urls.splice(index, 1);
        };

        $scope.submit = function() {

            this.search.urls = [];

            for(var i in this.urls) {
                this.search.urls.push(this.urls[i].link)
            }

            this.search.$save();
        };
    })
    .directive('lbcTypeahead', function() {

        return function(scope, element, attrs) {
            element.typeahead({
                name: 'cities',
                valueKey: 'realName',
                limit: 10,
                remote: {
                    url: '/ws/cities?q=%QUERY',
                    filter: function(cities) {
                        for(var i in cities) {
                            if(scope.cityExists(cities[i])) {
                                cities.splice(i, 1);
                            }
                        }

                        return cities;
                    }
                }
            }).on('typeahead:selected', function(elt, city) {
                element.val('');
                scope.addCity(city);
            });
        };
    });
