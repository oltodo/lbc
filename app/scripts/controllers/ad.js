'use strict';

angular.module('lbcApp')
    .controller('AdCtrl', function ($scope, breadcrumbs, $routeParams, Ad, Search, $q) {
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

        Search.get({ id: $routeParams.idSearch }, function(search) {
            $scope.search = search;
            
            breadcrumbs.prepend({
                name: search.title,
                path: '/search/'+search._id
            })    

        });

        getAd().then(function(ad) {
            $scope.ad = ad;

            breadcrumbs.append({
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
        return function (scope, elm, attrs) {
            var $gallery = $(elm[0]);
            $gallery.addClass('owl-carousel');

            scope.$watch(attrs.slideit, function (images) {
                if(typeof images !== 'object' || images.length === 0) {
                    return;
                }
                
                var html = '';

                for (var i in images) {
                    html += '<div>';
                    html += '   <img class="lazyOwl" data-src="' + images[i] + '" alt="" />';
                    html += '</div>';
                }

                $gallery.html(html)
                $gallery.owlCarousel({
                    singleItem: true,
                    navigation: true,
                    lazyLoad: true
                });
            });
        };
    })


    .directive('tagit', function () {
        return function (scope, elm, attrs) {

            scope.$watch(attrs.tagit, function (tag) {
                if(undefined === tag) {
                    return;
                }
                
                var styles = {};

                // styles.height = '22px';
                styles.float = 'left';
                styles.color = '#222';
                styles.paddingLeft = '5px';
                
                switch(tag) {
                    case 'A':
                        styles.background = '#009136';
                        styles.width = '50px';
                        break;

                    case 'B':
                        styles.background = '#51a928';
                        break;

                    case 'C':
                        styles.background = '#c9d301';
                        break;

                    case 'D':
                        styles.background = '#feed01';
                        break;

                    case 'E':
                        styles.background = '#fbbb01';
                        break;

                    case 'F':
                        styles.background = '#eb690b';
                        break;

                    case 'G':
                        styles.background = '#e3001b';
                        styles.color = 'white';
                        break;

                    case 'H':
                        styles.background = '#4d4d4d';
                        styles.color = 'white';
                        break;

                    case 'I':
                        styles.background = '#161616';
                        styles.color = 'white';
                        styles.width = '50px';
                        break;

                    default:
                        elm.html('<i>Unrecognized tag `'+tag+'`</i>');
                        return;
                }

                styles.width = (50+(tag.charCodeAt(0)-65)*20)+'px';

                var $span1 = $('<span></span>');
                $span1.css(styles).text(tag);

                var $span2 = $('<span></span>');
                $span2.css({
                    float: 'left',
                    height: 0,
                    width: 0,
                    border: 'solid transparent',
                    borderWidth: '10px 0 10px 10px',
                    borderLeftColor: styles.background
                })

                $(elm).append($span1, $span2);
            }, true);
        };
    });