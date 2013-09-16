'use strict';

angular.module('lbcApp')
    .controller('SearchEditCtrl', function ($scope, $routeParams, $http, breadcrumbs) {
        breadcrumbs.clean();

        $http.get('/ws/search/'+$routeParams.id).success(function(search) {
            $scope.search = search;

            breadcrumbs.add({
                name: search.title,
                path: '/'
            });

            breadcrumbs.add({
                name: 'Edition',
                path: '/search/'+search._id
            });
        });

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
            var search = this.search;

            $http.put('/ws/search/'+search._id, {
                search: search
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
