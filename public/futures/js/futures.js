angular.module('futuresApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('futuresApp').config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    // Initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    // Disable IE ajax request caching
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

    $routeProvider
        .when('/home', { templateUrl: '/futures/home',
            controller: 'FuturesHomeCtrl'
        })
        .when('/orders', { templateUrl: '/futures/orders',
            controller: 'FuturesOrdersCtrl'
        })
        .otherwise({
            redirectTo: '/home'
        });
}]);

/*
angular.module("futuresApp", [])
    .directive("futuresChart", function () {
        return function (scope, element, attrs) {
            var data = scope[attrs["unorderedList"]];
            if (angular.isArray(data)) {
                for (var i = 0; i < data.length; i++) {
                    console.log("Item: " + data[i].name);
                }
            }
        }
    });
    */