'use strict';
angular.module('futuresApp').controller('FuturesHomeCtrl', ['$scope', '$window', '$location', '$modal', '$http', '$timeout', function($scope, $window, $location, $modal, $http, $timeout) {
    $scope.chartLabels = ["9:15", "10:15", "11:15", "13:45", "14:45", "15:15"];
    $scope.chartData = [4188.57, 4040.48, 4053.70, 4182.93, 4023.93, 3872.15, 4188.57, 4040.48, 4053.70, 4182.93, 4023.93, 3872.15, 4053.70, 4182.93, 4023.93, 3872.15, 4188.57, 4040.48];
    $scope.user = $scope.data.currentUser;
    var HAND = 10000;

    $scope.tradeData = {
        up: 0,
        down: 0,
        sell: 0
    };

    function getUserPositions() {
        $http.get('/api/futures/get_positions')
            .success(function (data, status) {
                var position = data.position;
                if (position) {
                    $scope.tradeData.up = position.longQuantity / HAND;
                    $scope.tradeData.down = position.shortQuantity / HAND;
                    $scope.tradeData.sell = position.quantity / HAND;
                }
                $scope.profit = data.user.cash / 100 - 1000000;
            })
            .error(function(data, status) {
                displayError(data.error_msg);
            });
    }

    getUserPositions();

    function displayError(msg) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
        }, 2000);
    }

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
            resolve: {}
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

    /*
    if (!$scope.data.introPopupOpened) {
        $scope.openIntroPopup('lg');
        $scope.data.introPopupOpened = true;
    }
    */

    $scope.btnClick = function() {
        $scope.openGainPopup('lg');
    };

    $scope.showTradeTime = function() {
        $scope.openTimeHintPopup('lg');
    };

    $scope.withdraw = function() {
        $location.path('/profit_exchange');
    };

    $scope.showRank = function() {
        $location.path('/user_rank');
    };

    $scope.placeOrder = function(type) {
        var quantity = 10000;
        if (type === -1) {
            quantity = 0 - quantity;
        }
        var forceClose = false;
        if (type === 0) {
            forceClose = true;
        }
        $http.post('/api/futures/create_order', {quantity:quantity, force_close:forceClose})
            .success(function(data, status) {
                getUserPositions();
                if (type === 0) {
                    if ($scope.tradeData.sell === 0) {
                        $scope.openGainPopup('lg');
                    }
                }
            })
            .error(function(data, status) {
                displayError(data.error_msg);
            });
    };
}]);

