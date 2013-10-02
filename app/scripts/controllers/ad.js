'use strict';

angular.module('lbcApp')
    .controller('AdCtrl', function ($scope, breadcrumbs, $routeParams, Ad, $q) {
        breadcrumbs.clean();

        $scope.reloading = false;


        var getAd = function() {
            var defer = $q.defer();

            Ad.get({
                id: $routeParams.id
            }, function(ad) {
                defer.resolve(ad);
            });

            return defer.promise;
        }

        getAd().then(function(ad) {
            $scope.ad = ad;

            breadcrumbs.add({
                name: ad.title
            });
        });

        $scope.reload = function() {
            $scope.reloading = true;

            $scope.ad.partial = true;
            $scope.ad.$update(function() {
                getAd().then(function(ad) {
                    $scope.ad = ad;
                    $scope.reloading = false;
                });                       
            });
        }
    })

    .directive('slideit', function () {

        var slider = null;

        return function (scope, elm, attrs) {
            var $gallery = $('#'+$(elm[0]).attr('id'));

            scope.$watch(attrs.slideit, function (images) {
                if(typeof images !== 'object' || images.length === 0) {
                    return;
                }

                var html = '';

                for (var i in images) {
                    html += '<li><img src="' + images[i] + '" alt="" /></li>';
                }

                $gallery.html(html);

                if(slider !== null) {
                    slider.reloadSlider()
                } else {
                    slider = $gallery.bxSlider({
                        mode: 'horizontal'
                    });                    
                }
            });
        };
    });

