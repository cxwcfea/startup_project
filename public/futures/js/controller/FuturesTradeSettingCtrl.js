'use strict';

angular.module('futuresApp').controller('FuturesTradeSettingCtrl', ['$scope', '$modal', '$http', '$timeout', '$location', function($scope, $modal, $http, $timeout, $location) {
    $scope.user = $scope.data.currentUser;

    function displayError(msg, redirect) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
            if (redirect) {
                $location.path('/home');
            }
        }, 2000);
    }

    var OPEN_TEXT = '开启设置';
    var CLOSE_TEXT = '关闭设置';
    var SETTING_TEXT = '设置中';
    var processing = false;

    $scope.setDefaultPoint = function() {
        if ($scope.data.real) {
            $scope.winPoint = $scope.user.wechat.real_trader.winPoint;
            $scope.lossPoint = $scope.user.wechat.real_trader.lossPoint;
            $scope.open = $scope.user.wechat.real_trader.tradeControl;
        } else {
            $scope.winPoint = $scope.user.wechat.trader.winPoint;
            $scope.lossPoint = $scope.user.wechat.trader.lossPoint;
            $scope.open = $scope.user.wechat.trader.tradeControl;
        }
        if ($scope.open === undefined || $scope.open === null) {
            $scope.open = false;
        }
        $scope.toggleSetting();
    };

    function makeSettingRequest(open) {
        var type = 0;
        if ($scope.data.real) {
            type = 1;
        }
        $http.post('/futures/change_trade_setting', {open:open, win:$scope.winPoint, loss:$scope.lossPoint, type:type})
            .success(function(data, status) {
                displayError('设置成功', true);
                if ($scope.data.real) {
                    $scope.user.wechat.real_trader.winPoint = $scope.winPoint;
                    $scope.user.wechat.real_trader.lossPoint = $scope.lossPoint;
                    $scope.user.wechat.real_trader.tradeControl = open;
                } else {
                    $scope.user.wechat.trader.winPoint = $scope.winPoint;
                    $scope.user.wechat.trader.lossPoint = $scope.lossPoint;
                    $scope.user.wechat.trader.tradeControl = open;
                }
                processing = false;
            })
            .error(function(data, status) {
                displayError('设置失败');
                processing = false;
            });
    }

    $scope.changeSetting = function() {
        if (processing) {
            return;
        }
        processing = true;
        var open = !$scope.open;
        if (open) {
            if (!$scope.winPoint && !$scope.lossPoint) {
                displayError('止损点，止盈点请至少输入一个');
                processing = false;
                return;
            }
            (function () {
                var modalInstance = $modal.open({
                    animation: true,
                    windowClass: 'xx-dialog',
                    templateUrl: 'views/trade_setting_open_popup.html',
                    controller: 'InfoModalCtrl',
                    size: 'lg',
                    resolve: {}
                });

                modalInstance.result.then(function () {
                    makeSettingRequest(open);
                }, function () {
                    processing = false;
                    $scope.toggleSetting();
                });
            })();
        } else {
            $scope.setDefaultPoint();
            (function () {
                var modalInstance = $modal.open({
                    animation: true,
                    windowClass: 'xx-dialog',
                    templateUrl: 'views/trade_setting_close_popup.html',
                    controller: 'InfoModalCtrl',
                    size: 'lg',
                    resolve: {}
                });

                modalInstance.result.then(function () {
                    makeSettingRequest(open);
                }, function () {
                    processing = false;
                    $scope.toggleSetting();
                });
            })();
        }
    };

    $scope.toggleSetting = function() {
        if (processing) {
            $scope.titleText = SETTING_TEXT;
            return;
        }
        if ($scope.open) {
            $scope.titleText = CLOSE_TEXT;
        } else {
            $scope.titleText = OPEN_TEXT;
        }
    };
}]);