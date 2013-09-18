'use strict';

angular.module('lbcApp')
    .controller('SearchEditCtrl', function ($scope, Search, $routeParams, $http, breadcrumbs) {
        breadcrumbs.clean();

        if(!$routeParams.id) {
            $scope.search = new Search();
            $scope.search.cities = [];

            breadcrumbs.add({
                name: 'Nouvelle recherche',
                path: '/search/new'
            });
        } else {

            Search.get({ id: $routeParams.id }, function(search) {
                $scope.search = search;

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
        }

        // Return false or index
        $scope.cityExists = function(city) {
            var cities = this.search.cities;

            for(var i in cities) {
                if(cities[i]._id == city._id) {
                    return i;
                }
            }   

            return false;
        }

        $scope.submit = function() {
            this.search.$save(function(a,b) {
                console.log('ok');   
            }, function(a,b) {
                console.log(a);
            });
        }
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
                        for(i in cities) {
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
