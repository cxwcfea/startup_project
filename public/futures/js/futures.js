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
            */

            if (!scope.data.socket) {
                var socket = scope.data.socket = io.connect();
                socket.on('connect', function () {
                    // send a join event with your name
                    socket.emit('join', 'user');
                });
                socket.on('new_data', function(newData) {
                    //series.addPoint(newData, true, true);
                    scope.data.series.setData(newData.data1, true, true);
                    scope.data.fake_series.setData(newData.data2, true, true);
                    scope.data.flags_series.setData(scope.data.flags_data, true, true);
                });
            }

            if (scope.data.chart) {
                scope.data.chart.destroy();
            }
            scope.data.chart = new Highcharts.StockChart({
                chart: {
                    renderTo: element[0],
                    events : {
                        load : function () {
                            // set up the updating of the chart each second
                            scope.data.series = this.series[0];
                            scope.data.fake_series = this.series[1];
                            scope.data.flags_series = this.series[2];
                        }
                    }
                },

                exporting: {
                    enabled: false
                },
                credits: {
                    enabled: false
                },
                scrollbar: {
                    enabled: false
                },
                navigator: {
                    enabled: false,
                    height: 30
                },
                rangeSelector: {
                    enabled: false,
                    buttons: [{
                        type: 'minute',
                        count: 20,
                        text: '20M'
                    }, {
                        type: 'all',
                        text: 'All'
                    }]
                },
                yAxis: {
                    opposite: false
                },
                series : [
                    {
                        name : '股指',
                        data: [],
                        id: 'stock_data'
                    },
                    {
                        name : '股指2',
                        data: []
                    },
                    {
                        type: 'flags',
                        shape : 'squarepin',
                        width : 20,
                        onSeries: 'stock_data',
                        data: [],
                        id: 'stock_data_flags',
                        showInLegend: false
                    }
                ]
            });

            scope.$watch('currentOrder', function(newValue, oldValue) {
                if (newValue) {
                    var value = newValue.price/100;
                    var color = '#FF0000';
                    if (newValue.quantity < 0) {
                        color = '#00FF00';
                    }
                    scope.data.flags_data.push({
                        x: Date.parse(newValue.timestamp),
                        y: value,
                        color:'#000000',
                        fillColor: color,
                        text: value.toFixed(0),
                        title: value.toFixed(0)
                    });
                } else {
                    scope.data.flags_data = [];
                }
            });
        }
    });
