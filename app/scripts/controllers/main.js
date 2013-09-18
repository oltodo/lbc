'use strict';

angular.module('lbcApp')
    .controller('MainCtrl', function ($scope, Search, breadcrumbs) {
        breadcrumbs.clean();

        breadcrumbs.add({
            name: 'Recherches'
        });

        $scope.searches = Search.query();
    });
