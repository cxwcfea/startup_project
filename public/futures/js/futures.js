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
        .when('/profit_exchange', { templateUrl: '/futures/profit_exchange',
            controller: 'FuturesExchangeCtrl'
        })
        .when('/add_wechat', { templateUrl: '/futures/add_wechat',
            controller: 'FuturesWechatCtrl'
        })
        .when('/user_rank', { templateUrl: '/futures/user_rank',
            controller: 'FuturesUserRankCtrl'
        })
        .otherwise({
            redirectTo: '/home'
        });
}]);

angular.module('futuresApp').controller('IntroModalCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('futuresApp').controller('GainModalCtrl', ['$scope', '$modalInstance', 'profit', 'constant', 'cash', function ($scope, $modalInstance, profit, constant, cash) {
    $scope.profit = profit;
    $scope.constant = constant;
    $scope.cash = cash;
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('futuresApp').controller('InfoModalCtrl', function ($scope, $modalInstance) {
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

angular.module("futuresApp")
    .directive("futuresChart", function () {
        return function (scope, element, attrs) {
            /*
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
            */

            var socket = io.connect();
            socket.on('connect', function () {
                console.log('socket connect');
                var series;
                // send a join event with your name
                socket.emit('join', 'user');
                socket.on('new_data', function(newData) {
                    console.log('new data ' + newData);
                    series.addPoint(newData, true, true);
                });
                socket.on('history_data', function(historyData) {
                    alert(historyData);
                    element.highcharts('StockChart', {
                        chart : {
                            events : {
                                load : function () {
                                    // set up the updating of the chart each second
                                    series = this.series[0];
                                    /*
                                    setInterval(function () {
                                        var x = (new Date()).getTime(), // current time
                                            y = Math.round(Math.random() * 100);
                                        series.addPoint([x, y], true, true);
                                    }, 1000);
                                    */
                                }
                            }
                        },

                        rangeSelector: {
                            buttons: [{
                                count: 30,
                                type: 'minute',
                                text: '30M'
                            }, {
                                count: 60,
                                type: 'minute',
                                text: '60M'
                            }],
                            inputEnabled: false,
                            selected: 0
                        },

                        /*
                         title : {
                         text : 'Live random data'
                         },
                         */

                        exporting: {
                            enabled: false
                        },
                        credits: {
                            enabled: false
                        },
                        scrollbar: {
                            enabled: false
                        },
                        /*
                         rangeSelector: {
                         enabled: false
                         },
                         navigator: {
                         enabled: false
                         },
                         */

                        series : [{
                            name : '股指',
                            /*
                            data : (function () {
                                // generate an array of random data
                                var data = [], time = (new Date()).getTime(), i;

                                for (i = -999; i <= 0; i += 1) {
                                    data.push([
                                        time + i * 1000,
                                        Math.round(Math.random() * 100)
                                    ]);
                                }
                                return data;
                            }())
                            */
                            data: historyData
                        }]
                    });
                });
            });

        }
    });
