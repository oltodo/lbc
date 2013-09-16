angular.module('lbcApp')
    .controller('BreadcrumbsCtrl', function ($scope, breadcrumbs) {
        $scope.breadcrumbs = breadcrumbs;
    });