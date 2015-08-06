'use strict';
angular.module('futuresApp').controller('FuturesHomeCtrl', ['$scope', '$window', '$location', '$modal', '$http', '$timeout', '$interval', function($scope, $window, $location, $modal, $http, $timeout, $interval) {
    $scope.chartLabels = ["9:15", "10:15", "11:15", "13:45", "14:45", "15:15"];
    $scope.chartData = [4188.57, 4040.48, 4053.70, 4182.93, 4023.93, 3872.15, 4188.57, 4040.48, 4053.70, 4182.93, 4023.93, 3872.15, 4053.70, 4182.93, 4023.93, 3872.15, 4188.57, 4040.48];
    $scope.user = $scope.data.currentUser;
    var HAND = 100;
    var InitCapital = 150000;
    var Deposit = 30000;
    $scope.data.selectedItem = 1;
    $scope.tradeClose = false;
	$scope.browserHeight = document.documentElement.clientHeight;

    if (!$scope.data.timeoutSet) {
        $scope.data.timeoutSet = true;
        var now = moment();

        var firstEnd = moment();
        firstEnd.hour(11);
        firstEnd.minute(30);
        firstEnd.second(0);

		if (now < firstEnd) {
			$timeout(function() {
				$scope.tradeClose = true;
				$scope.openTimeHintPopup('lg');
			}, firstEnd-now);
		}

        var secondEnd = moment();
        secondEnd.hour(15);
        secondEnd.minute(15);
        secondEnd.second(0);

		if (now < secondEnd) {
			$timeout(function() {
				$scope.tradeClose = true;
				$scope.openTimeHintPopup('lg');
			}, secondEnd-now);
		}
	}

    $scope.tradeData = {
        up: 0,
        down: 0,
        sell: 0
    };

    var delta = 0;
    function getUserPositions(init) {
        $http.get('/api/futures/get_positions')
            .success(function (data, status) {
                var position = data.position;
                if (position) {
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
        }, 2000);
    }

    function fetchUserProfit() {
        $http.get('/api/futures/get_user_profit?product=' + $scope.data.productID)
            .success(function(data, status) {
                if (data.result != null && data.result != undefined) {
                    $scope.profit = data.result / 100;
                    $scope.lastProfit = data.lastProfit / 100;
                    $scope.currentPrice = data.lastPrice / 100;
                    $scope.balance = Deposit - $scope.profit;
                } else {
                    $scope.profit = 0;
                    $scope.lastProfit = 0;
                    $scope.currentPrice = $scope.data.lastPoint;
                    $scope.balance = Deposit;
                }
            })
            .error(function(data, status) {
                $scope.profit = 0;
                $scope.lastProfit = 0;
                $scope.currentPrice = $scope.data.lastPoint;
                $scope.balance = Deposit;
            });
    }

    fetchUserProfit();
    $interval(function() {
        fetchUserProfit();
    }, 2000);

    $scope.showShareHint = false;
    $scope.openIntroPopup = function (size) {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/intro_popup.html',
            controller: 'IntroModalCtrl',
            size: size,
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

    $scope.help = function() {
        $scope.openIntroPopup('lg');
    };

    $scope.currentOrder = null;

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

        if ($scope.tradeData.sell === 0 && type === 0) {
            displayError('您当前没有持仓');
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
        $http.post('/api/futures/create_order', {quantity:quantity, forceClose:forceClose, product:$scope.data.productID})
            .success(function(data, status) {
                getUserPositions();
                var orderType = data.quantity > 0 ? '涨' : '跌';

                if (type != 0) {
                    //displayError('您成功买' + orderType + Math.abs(data.quantity/100) + '手,价格' + (data.price/100).toFixed(1) + '元');
                    $scope.currentOrder = data;
                } else {
                    //orderType = $scope.tradeData.up > 0 ? '涨' : '跌';
                    //displayError('您成功平' + orderType + '' + $scope.tradeData.sell + '手');
                    $scope.currentOrder = null;
                }
            })
            .error(function(data, status) {
                displayError(data.error_msg);
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

