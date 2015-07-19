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

            if (scope.data.chart) {
                scope.data.chart.destroy();
            }

            var socket = io.connect();
            var series, flags_series, flags_data;
            flags_data = [];
            socket.on('connect', function () {
                console.log('socket connect');
                // send a join event with your name
                socket.emit('join', 'user');
                socket.on('history_data', function(historyData) {
                    socket.on('new_data', function(newData) {
                        // console.log('new data ' + newData);
                        //series.addPoint(newData, true, true);
                        /*
                        var flags_data = [{
                                   x: newData[200][0],
                                   y: newData[200][1],
                                   //color:'#FF0000',
                                   //fillColor: '#FF0000',
                                   text: Math.round(newData[200][1]),
                                   title: Math.round(newData[200][1])
                                 }, {
                                   x: newData[400][0],
                                   y: newData[400][1],
                                   //color:'#00FF00',
                                   //fillColor: '#00FF00',
                                   text: Math.round(newData[400][1]),
                                   title: Math.round(newData[400][1])
                                 }];
                                 */
                        series.setData(newData, true, true);
                        flags_series.setData(flags_data, true, true);
                    });
                    scope.data.chart = element.highcharts('StockChart', {
                        chart : {
                            events : {
                                load : function () {
                                    // set up the updating of the chart each second
                                    series = this.series[0];
                                    flags_series = this.series[1];
                                }
                            }
                        },

                        /*
                        rangeSelector: {
                            buttons: [{
                                count: 20,
                                type: 'second',
                                text: '20S'
                            }, {
                                count: 60,
                                type: 'second',
                                text: '60S'
                            }],
                            inputEnabled: false,
                            selected: 0
                        },

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
                        navigator: {
                            enabled: false
                        },
                        rangeSelector: {
                            enabled: false
                        },
                        yAxis: {
                            opposite: false
                        },
                        series : [
                            {
                                name : '股指',
                                data: historyData,
                                id: 'stock_data'
                            },
                            {
                                type: 'flags',
                                shape : 'squarepin',
                                width : 20,
                                onSeries: 'stock_data',
                                data: [],
                                id: 'stock_data_flags',
                                showInLegend: false
                        }]
                    });
                });
            });

            scope.$watch('currentOrder', function(newValue, oldValue) {
                if (newValue) {
                    var value = newValue.price/100;
                    var color = '#FF0000';
                    if (newValue.quantity < 0) {
                        color = '#00FF00';
                    }
                    flags_data.push({
                        x: Date.parse(newValue.timestamp),
                        y: value,
                        color:'#000000',
                        fillColor: color,
                        text: value.toFixed(0),
                        title: value.toFixed(0)
                    });
                } else {
                    flags_data = [];
                }
            });

        }
    });
