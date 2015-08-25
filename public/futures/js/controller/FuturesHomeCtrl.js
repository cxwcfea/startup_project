'use strict';
angular.module('futuresApp').controller('FuturesHomeCtrl', ['$scope', '$window', '$location', '$modal', '$http', '$timeout', '$interval', 'Socket', function($scope, $window, $location, $modal, $http, $timeout, $interval, Socket) {
    $scope.user = $scope.data.currentUser;
    if ($scope.user.real === true) {
        $scope.data.real = true;
    }
    if ($scope.data.real && $scope.user.wechat.real_trader) {
        $scope.data.deposit = $scope.user.wechat.real_trader.deposit / 100;
        $scope.data.cash = $scope.user.wechat.real_trader.cash;
    } else {
        $scope.data.deposit = 30000;
        $scope.data.cash = 20000000;
    }
    var TEXT = '现在是非交易时间';
    var REAL_TEXT = '您的账户不能交易';
    var HAND = 100;
    var InitCapital = 200000;
    $scope.data.selectedItem = 1;
    $scope.tradeClose = false;
	$scope.browserHeight = document.documentElement.clientHeight;
    $scope.closeText = TEXT;

    var now = moment();

    var firstStart = moment();
    firstStart.hour(9);
    firstStart.minute(15);
    firstStart.second(0);

    var secondStart = moment();
    secondStart.hour(13);
    secondStart.minute(0);
    secondStart.second(0);

    var firstEnd = moment();
    firstEnd.hour(11);
    firstEnd.minute(30);
    firstEnd.second(0);

    var secondEnd = moment();
    secondEnd.hour(15);
    secondEnd.minute(12);
    secondEnd.second(0);

    if ((now >= firstStart && now <= firstEnd) || (now >= secondStart && now <= secondEnd)) {
        if (!$scope.data.timeoutSet) {
            $scope.data.timeoutSet = true;

            if (now < firstEnd) {
                $timeout(function() {
                    $scope.tradeClose = true;
                    $scope.closeText = TEXT;
                    $scope.openTimeHintPopup('lg');
                }, firstEnd-now);
            }

            if (now < secondEnd) {
                $timeout(function() {
                    $scope.tradeClose = true;
                    $scope.closeText = TEXT;
                    $scope.openTimeHintPopup('lg');
                }, secondEnd-now);
            }
        }
    } else {
        //$scope.tradeClose = true;
    }

    if ($scope.data.real && $scope.user.wechat.status !== 4) {
        //$scope.tradeClose = true;
        $scope.closeText = REAL_TEXT;
    }

    $timeout(function() {
        $http.get('/futures/get_nearest_orders?type=' + ($scope.data.real ? 1 : 0))
            .success(function(data, status) {
                for (var i = 0; i < data.length; ++i) {
                    var order = data[i];
                    var value = order.price/100;
                    var color = '#FF0000';
                    if (order.quantity < 0) {
                        color = '#00FF00';
                    }
                    if ($scope.data.flags_data) {
                        $scope.data.flags_data.push({
                            x: Date.parse(order.timestamp),
                            y: value,
                            color:'#000000',
                            fillColor: color,
                            text: '',
                            title: ' '
                        });
                    }
                }
            })
            .error(function(data, status) {
                console.log(data.error_msg);
            });
    }, 1500);


    $scope.tradeData = {
        up: 0,
        down: 0,
        sell: 0
    };

    function undatePosition(position) {
        if (position) {
            $scope.openPrice = position.total_point;
            $scope.tradeData.down = $scope.tradeData.up = $scope.tradeData.sell = 0;
            if (position.quantity) {
                if (position.longQuantity > position.shortQuantity) {
                    $scope.tradeData.up = (position.longQuantity - position.shortQuantity) / HAND;
                    $scope.tradeData.down = 0;
                    $scope.tradeData.sell = $scope.tradeData.up;
                } else {
                    $scope.tradeData.down = (position.shortQuantity - position.longQuantity) / HAND;
                    $scope.tradeData.up = 0;
                    $scope.tradeData.sell = $scope.tradeData.down;
                }
            }
        }
    }

    var delta = 0;
    function getUserPositions(init) {
        $http.get('/api/futures/get_positions?type=' + ($scope.data.real ? 1 : 0))
            .success(function (data, status) {
                var position = data.position;
                undatePosition(position);
                $scope.cash = data.user.cash/100;
            })
            .error(function(data, status) {
                displayError(data.error_msg);
            });
    }

    getUserPositions(true);

    function displayError(msg) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
        }, 1000);
    }

    function fetchUserProfit() {
        $http.get('/api/futures/get_user_profit?product=' + $scope.data.productID + '&type=' + ($scope.data.real ? 1 : 0))
            .success(function(data, status) {
                if (data.result != null && data.result != undefined) {
                    $scope.profit = data.result / 100;
                    $scope.lastProfit = data.lastProfit / 100;
                    $scope.currentPrice = data.lastPrice / 100;
                    $scope.balance = $scope.data.deposit + $scope.profit + $scope.lastProfit;
                    $scope.data.balance = $scope.balance;
                    $scope.yesterdayClose = data.yesterdayClose;
                    $scope.pointDelta = ($scope.currentPrice - $scope.yesterdayClose) / $scope.yesterdayClose * 100;
                    undatePosition(data.portfolio);
                } else {
                    $scope.profit = 0;
                    $scope.lastProfit = 0;
                    $scope.currentPrice = $scope.data.lastPoint;
                    $scope.balance = $scope.data.deposit;
                    $scope.data.balance = $scope.balance;
                    $scope.yesterdayClose = 0;
                    $scope.pointDelta = 0;
                }
            })
            .error(function(data, status) {
                $scope.profit = 0;
                $scope.lastProfit = 0;
                $scope.currentPrice = $scope.data.lastPoint;
                $scope.balance = 0;
                $scope.data.balance = $scope.balance;
                $scope.yesterdayClose = 0;
                $scope.pointDelta = 0;
            });
    }

    fetchUserProfit();
    $interval(function() {
        fetchUserProfit();
    }, 500);

    $scope.showShareHint = false;
    $scope.openIntroPopup = function () {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/intro_popup.html',
            controller: 'IntroModalCtrl',
            size: 'lg',
            resolve: {}
        });

        modalInstance.result.then(function () {
            console.log('Modal dismissed at: ' + new Date());
			$scope.data.status = 1;
        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.openGainPopup = function (size) {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/gain_popup.html',
            controller: 'GainModalCtrl',
            size: size,
            resolve: {
                profit: function () {
                    return delta;
                },
                constant: function() {
                    return 1000;
                },
                cash: function() {
                    if ($scope.user.score > 99) {
                        return 2;
                    } else if ($scope.user.score > 399) {
                        return 3;
                    } else if ($scope.user.score > 999) {
                        return 4;
                    } else {
                        return 1;
                    }
                }
            }
        });

        modalInstance.result.then(function () {
            $scope.showShareHint = true;
        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.openRiskPopup = function (size) {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/risk_popup.html',
            controller: 'InfoModalCtrl',
            size: size,
            resolve: {}
        });

        modalInstance.result.then(function () {
            console.log('Modal dismissed at: ' + new Date());
        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.openTimeHintPopup = function (size) {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/time_hint_popup.html',
            controller: 'InfoModalCtrl',
            size: size,
            resolve: {}
        });

        modalInstance.result.then(function () {
            console.log('Modal dismissed at: ' + new Date());
        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

    var openResetPopup = function () {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/reset_confirm_popup.html',
            controller: 'InfoModalCtrl',
            size: 'lg',
            resolve: {}
        });

        modalInstance.result.then(function () {
            $http.get('/futures/reset_user')
                .success(function(data, status) {
                    $scope.cash = InitCapital;
                    displayError('重置成功');
                })
                .error(function(data, status) {
                    displayError(data.error_msg);
                });
        }, function () {
        });
    };

    var openProfitHintPopup = function () {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/profit_not_enough_popup.html',
            controller: 'InfoModalCtrl',
            size: 'lg',
            resolve: {}
        });

        modalInstance.result.then(function () {
        }, function () {
        });
    };

    $scope.showTradeTime = function() {
        $scope.openTimeHintPopup('lg');
    };

    $scope.withdraw = function() {
        $location.path('/profit_exchange');
    };

    $scope.setting = function() {
        $location.path('/trade_setting');
    };

    $scope.currentOrder = null;

    //var orderProcessing = false;
    $scope.placeOrder = function(type) {
        if ($scope.tradeClose) {
            return;
        }
        if (type == 0) {
            $scope.PButtonPressed = true;
            $timeout(function() {
                $scope.PButtonPressed = false;
            }, 500);
        }
        if (type == 1) {
            $scope.ZButtonPressed = true;
            $timeout(function() {
                $scope.ZButtonPressed = false;
            }, 500);
        }
        if (type == -1) {
            $scope.DButtonPressed = true;
            $timeout(function() {
                $scope.DButtonPressed = false;
            }, 500);
        }

        /*
        if (orderProcessing) {
            return;
        }
        */

        //orderProcessing = true;
        if ($scope.tradeData.sell === 0 && type === 0) {
            //displayError('您当前没有持仓');
            return;
        }

        var quantity = 100;
        if (type === -1) {
            quantity = 0 - quantity;
        }
        var forceClose = false;
        if (type === 0) {
            forceClose = true;
        }
        $http.post('/api/futures/create_order', {quantity:quantity, forceClose:forceClose, product:$scope.data.productID, type:($scope.data.real ? 1 : 0)})
            .success(function(data, status) {
                //orderProcessing = false;
                if (type != 0) {
                    //displayError('您成功买' + orderType + Math.abs(data.quantity/100) + '手,价格' + (data.price/100).toFixed(1) + '元');
                    $scope.currentOrder = data;
                    Socket.emit('getData', {name:$scope.data.currentUser._id, room:0});
                } else {
                    //orderType = $scope.tradeData.up > 0 ? '涨' : '跌';
                    //displayError('您成功平' + orderType + '' + $scope.tradeData.sell + '手');
                    $scope.currentOrder = null;
                }
            })
            .error(function(data, status) {
                //orderProcessing = false;
                displayError(data.error_msg);
                console.log(data.error_msg);
            });
    };

    $scope.makeAppointment = function() {
        /*
        if ($scope.lastProfit <= 3000) {
            openProfitHintPopup();
            return;
        }
        */
        $location.path('/appointment');
    };

    $scope.resetCapital = function() {
        openResetPopup();
    };

}]);

