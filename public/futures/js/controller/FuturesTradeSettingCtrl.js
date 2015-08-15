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
    var OPEN_WARN = '系统交易（平仓）由程序自动执行，实际成交取决于交易所交易状况，不保证时间平仓点与您设置的止盈点，止损点完全一致。开启“交易设置”代表您已经完全知悉和愿意承担自动平仓带来的不确定性。确定要打开交易设置吗？';
    var CLOSE_WARN = '关闭后，系统将不再为您在相应点位自动平仓，确认吗？';

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
            })
            .error(function(data, status) {
                displayError('设置失败');
            });
    }

    $scope.changeSetting = function() {
        var open = !$scope.open;
        if (open) {
            if (!$scope.winPoint && !$scope.lossPoint) {
                displayError('止损点，止盈点请至少输入一个');
                return;
            }
            (function () {
                var modalInstance = $modal.open({
                    animation: true,
                    windowClass: 'xx-dialog',
                    templateUrl: 'views/trade_setting_popup.html',
                    controller: 'InfoModalCtrl',
                    size: 'lg',
                    resolve: {
                        info: function() {
                            if (open) {
                                return CLOSE_WARN;
                            } else {
                                return OPEN_WARN;
                            }
                        }
                    }
                });

                modalInstance.result.then(function () {
                    makeSettingRequest(open);
                }, function () {
                });
            })();
        } else {
            $scope.setDefaultPoint();
            makeSettingRequest(open);
        }
    };

    $scope.toggleSetting = function() {
        if ($scope.open) {
            $scope.titleText = CLOSE_TEXT;
        } else {
            $scope.titleText = OPEN_TEXT;
        }
    };
}]);