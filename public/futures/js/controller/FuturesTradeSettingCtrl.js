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
            if ($scope.data.productID == 1) {
                $scope.winPoint = $scope.user.wechat.real_silverTrader.winPoint;
                $scope.lossPoint = $scope.user.wechat.real_silverTrader.lossPoint;
                $scope.open = $scope.user.wechat.real_silverTrader.tradeControl;
            } else {
                $scope.winPoint = $scope.user.wechat.real_trader.winPoint;
                $scope.lossPoint = $scope.user.wechat.real_trader.lossPoint;
                $scope.open = $scope.user.wechat.real_trader.tradeControl;
            }
        } else {
            if ($scope.data.productID == 1) {
                $scope.winPoint = $scope.user.wechat.silverTrader.winPoint;
                $scope.lossPoint = $scope.user.wechat.silverTrader.lossPoint;
                $scope.open = $scope.user.wechat.silverTrader.tradeControl;
            } else {
                $scope.winPoint = $scope.user.wechat.trader.winPoint;
                $scope.lossPoint = $scope.user.wechat.trader.lossPoint;
                $scope.open = $scope.user.wechat.trader.tradeControl;
            }
        }
        if ($scope.winPoint === 0) {
            $scope.winPoint = null;
        }
        if ($scope.lossPoint === 0) {
            $scope.lossPoint = null;
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
        $http.post('/futures/change_trade_setting', {open:open, win:$scope.winPoint, loss:$scope.lossPoint, type:type, product:$scope.data.productID})
            .success(function(data, status) {
                displayError('设置成功');
                $scope.open = open;
                if ($scope.data.real) {
                    if ($scope.data.productID == 1) {
                        $scope.user.wechat.real_silverTrader.winPoint = $scope.winPoint;
                        $scope.user.wechat.real_silverTrader.lossPoint = $scope.lossPoint;
                        $scope.user.wechat.real_silverTrader.tradeControl = open;
                    } else {
                        $scope.user.wechat.real_trader.winPoint = $scope.winPoint;
                        $scope.user.wechat.real_trader.lossPoint = $scope.lossPoint;
                        $scope.user.wechat.real_trader.tradeControl = open;
                    }
                } else {
                    if ($scope.data.productID == 1) {
                        $scope.user.wechat.silverTrader.winPoint = $scope.winPoint;
                        $scope.user.wechat.silverTrader.lossPoint = $scope.lossPoint;
                        $scope.user.wechat.silverTrader.tradeControl = open;
                    } else {
                        $scope.user.wechat.trader.winPoint = $scope.winPoint;
                        $scope.user.wechat.trader.lossPoint = $scope.lossPoint;
                        $scope.user.wechat.trader.tradeControl = open;
                    }
                }
                processing = false;
                $scope.toggleSetting();
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
                displayError('金额不低于200元');
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

    $scope.showLossPointHint = function() {
        $scope.lossPointHint = true;
    };

    $scope.showWinPointHint = function() {
        $scope.winPointHint = true;
    };

    $scope.closeDialogWindow = function() {
        $scope.lossPointHint = false;
        $scope.winPointHint = false;
    };
}]);