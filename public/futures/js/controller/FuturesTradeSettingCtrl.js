'use strict';

angular.module('futuresApp').controller('FuturesTradeSettingCtrl', ['$scope', '$modal', '$http', '$timeout', '$location', function($scope, $modal, $http, $timeout, $location) {
    $scope.user = $scope.data.currentUser;

    function displayError(msg) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
        }, 2000);
    }

    var OPEN_TEXT = '开启设置';
    var CLOSE_TEXT = '关闭设置';

    $scope.setDefaultPoint = function() {
        if ($scope.data.real) {
            $scope.winPoint = $scope.user.wechat.real_trader.winPoint;
            $scope.winPoint = $scope.user.wechat.real_trader.lossPoint;
            $scope.open = $scope.user.wechat.real_trader.tradeControl;
        } else {
            $scope.winPoint = $scope.user.wechat.trader.winPoint;
            $scope.lossPoint = $scope.user.wechat.trader.lossPoint;
            $scope.open = $scope.user.wechat.trader.tradeControl;
        }
        if ($scope.winPoint === undefined || $scope.winPoint === null) {
            $scope.winPonit = 0;
        }
        if ($scope.lossPoint === undefined || $scope.lossPoint === null) {
            $scope.lossPonit = 0;
        }
        if ($scope.open === undefined || $scope.open === null) {
            $scope.open = false;
        }
    };

    $scope.titleText = OPEN_TEXT;
    $scope.changeSetting = function() {
        if (!$scope.open) {
            if (!$scope.winPoint && !$scope.lossPoint) {
                displayError('止损点，止盈点请至少输入一个');
                return;
            }
        } else {
            $scope.setDefaultPoint();
            $scope.open = false;
        }
        var type = 0;
        if ($scope.data.real) {
            type = 1;
        }
        $http.post('/futures/change_trade_setting', {open:$scope.open, win:$scope.winPoint, loss:$scope.lossPoint, type:type})
            .success(function(data, status) {
                (function () {
                    var modalInstance = $modal.open({
                        animation: true,
                        backdrop: 'static',
                        windowClass: 'xx-dialog',
                        templateUrl: 'views/appointment_done_popup.html',
                        controller: 'InfoModalCtrl',
                        size: 'lg',
                        resolve: {}
                    });

                    modalInstance.result.then(function () {
                        if ($scope.data.real) {
                            $scope.user.wechat.real_trader.winPoint = $scope.winPoint;
                            $scope.user.wechat.real_trader.lossPoint = $scope.lossPoint;
                            $scope.user.wechat.real_trader.tradeControl = $scope.open;
                        } else {
                            $scope.user.wechat.trader.winPoint = $scope.winPoint;
                            $scope.user.wechat.trader.lossPoint = $scope.lossPoint;
                            $scope.user.wechat.trader.tradeControl = $scope.open;
                        }
                        $location.path('/home');
                    }, function () {
                    });
                })();
            })
            .error(function(data, status) {
                displayError('设置失败');
            });
    };

    $scope.toggleSetting = function() {
        if ($scope.open) {
            $scope.titleText = CLOSE_TEXT;
        } else {
            $scope.titleText = OPEN_TEXT;
        }
    };
}]);