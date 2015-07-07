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

angular.module("futuresApp")
    .directive("futuresChart", function () {
        return function (scope, element, attrs) {
            var chartLabels = scope[attrs['futuresChart']];
            var chartData = scope[attrs['chartData']];
            var ctx = element[0].getContext("2d");
            var data = {
                labels: chartLabels,
                datasets: [
                    {
                        label: "",
                        fillColor: "rgba(151,187,205,0.2)",
                        strokeColor: "rgba(151,187,205,1)",
                        pointColor: "rgba(151,187,205,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(151,187,205,1)",
                        data: chartData
                    }
                ]
            };
            new Chart(ctx).Line(data, {
                responsive: true
            });
        }
    });
