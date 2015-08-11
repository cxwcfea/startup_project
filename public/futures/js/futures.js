angular.module('futuresApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp', 'ngTouch']);

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
        .when('/products', { templateUrl: '/futures/products',
            controller: 'FuturesProductsCtrl'
        })
        .when('/user', { templateUrl: '/futures/user',
            controller: 'FuturesUserCtrl'
        })
        .when('/appointment', { templateUrl: '/futures/appointment',
            controller: 'FuturesAppointmentCtrl'
        })
        .when('/user_info', { templateUrl: '/futures/user_info',
            controller: 'FuturesUserInfoCtrl'
        })
        .when('/apply_close', { templateUrl: '/futures/apply_close',
            controller: 'FuturesApplyCloseCtrl'
        })
        .when('/contract', { templateUrl: '/futures/contract'
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
    $scope.data = {};
    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

angular.module("futuresApp")
    .service("util", [function () {
        this.generateBlankData = function(timestamp, lastPoint) {
            var endTime = timestamp + 2 * 3600 * 1000 + 15 * 60000;
            var ret = [];
            var startTime = lastPoint[0];
            while (startTime < endTime) {
                startTime += 1000;
                ret.push([startTime, null]);
            }
            return ret;
        }
    }]);

angular.module("futuresApp")
    .directive("futuresChart", ['util', function (util) {
        function updateData(root, newData, blankData, addFlag) {
            if (addFlag) {
                root.series.addPoint(newData, true, true);
            } else {
                root.series.setData(newData, true, true);
            }
            root.fake_series.setData(blankData, true, true);
            root.flags_series.setData(root.flags_data, true, true);
        }

        function fillWholeData(historyData, root, firstPoint) {
            var lastIndex = historyData.length - 1;
            var blankData = util.generateBlankData(firstPoint, historyData[lastIndex]);
            root.lastPoint = historyData[lastIndex][1];
            updateData(root, historyData, blankData, false);
            root.historyData = historyData;
        }

        return function (scope, element, attrs) {
            /*
            var chartLabels = scope[attrs['futuresChart']];
            var chartData = scope[attrs['chartData']];
            */

            if (!scope.data.historyData) {
                scope.data.historyData = [];
            }
            var firstPoint;
            if (!scope.data.socket) {
                var socket = scope.data.socket = io.connect();
                socket.on('connect', function () {
                    // send a join event with your name
                    socket.emit('join', {name:scope.data.currentUser._id, room:0});
                });
                socket.on('history_data', function(historyData) {
                    //series.addPoint(newData, true, true);
                    if (historyData.productID == scope.data.productID) {
                        firstPoint = historyData.data[0][0];
                        fillWholeData(historyData.data, scope.data, firstPoint);
                    }
                    /*
                    scope.data.series.setData(newData, true, true);
                    scope.data.fake_series.setData(blankData, true, true);
                    scope.data.flags_series.setData(scope.data.flags_data, true, true);
                    */
                });
                socket.on('new_data', function(newData) {
                    if (newData.productID == scope.data.productID) {
                        scope.data.historyData.push(newData.data);
                        scope.data.lastPoint = newData.data[1];
                        var blankData = util.generateBlankData(firstPoint, newData.data);
                        updateData(scope.data, newData.data, blankData, true);
                    }
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
                            if (scope.data.historyData.length) {
                                fillWholeData(scope.data.historyData, scope.data, firstPoint);
                            }
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
                    opposite: true
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
    }]);
