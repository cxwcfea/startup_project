'use strict';
angular.module('mobileApp').controller('MobileInvestSettingCtrl', ['$scope', '$window', '$timeout', '$http', '$location', function($scope, $window, $timeout, $http, $location) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {}
        }
        $scope.data.lastLocation = '/invest';
        $location.path('/login');
    } else {
        vm.inputError = false;
        vm.showRateDialog = false;
        if (vm.user.invest.enable === undefined || vm.user.invest.enable === null) {
            // default value
            vm.profit_rate = 12;
            vm.period = 30;
        } else {
            vm.profit_rate = vm.user.invest.profitRate;
            vm.period = vm.user.invest.duration;
        }

        vm.changeInvest = function() {
            if (!vm.profit_rate || vm.profit_rate > 15 || vm.profit_rate < 12) {
                vm.errorMsg = '请输入期望收益率，12到15之间';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 2000);
                return;
            }
            if (!vm.period || vm.period > 30 || vm.period < 5) {
                vm.errorMsg = '请输入期望项目借款期限，5到30之间';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 2000);
                return;
            }
            var data = {
                invest: {
                    profitRate: vm.profit_rate,
                    duration: vm.period,
                    enable: vm.user.invest.enable
                }
            };
            $http.post('/api/user/invest_update', data)
                .success(function(data, status) {
                    vm.success = true;
                    vm.user.invest.duration = vm.period;
                    vm.user.invest.profitRate = vm.profit_rate;
                    $timeout(function() {
                        vm.success = false;
                    }, 1500);
                })
                .error(function(data, status) {
                    vm.errorMsg = data.error_msg;
                    vm.inputError = true;
                    $timeout(function() {
                        vm.inputError = false;
                    }, 1500);
                });
        };

        vm.closeDialogWindow = function() {
            vm.showRateDialog = false;
            vm.showConfirmDialog = false;
            vm.showPeriodDialog = false;
        };

        vm.rechargeToInvestAccount = function() {
            if (!vm.user.identity.id) {
                vm.showIdentityDialog = true;
                return;
            }
            if (!vm.user.invest.enable) {
                var data = {
                    invest: {
                        profitRate: vm.profit_rate,
                        duration: vm.period,
                        enable: true
                    }
                };
                $http.post('/api/user/invest_update', data)
                    .success(function(data, status) {
                        //vm.showConfirmDialog = true;
                        vm.user.invest.enable = true;
                        $location.path('/invest_recharge');
                    })
                    .error(function(data, status) {
                        vm.errorMsg = data.error_msg;
                        vm.inputError = true;
                        $timeout(function() {
                            vm.inputError = false;
                        }, 1500);
                    });
            } else {
                $location.path('/invest_recharge');
            }
        };

        vm.enableChange = function() {
            if (!vm.user.invest.enable) {
                vm.user.invest.enable = true;
                vm.confirmDisableInvest = true;
            } else {
                vm.changeInvest();
            }
        };

        vm.disableInvest = function(flag) {
            var backup = vm.user.invest.enable;
            vm.user.invest.enable = !flag;
            vm.confirmDisableInvest = false;
            if (vm.user.invest.enable != backup) {
                vm.changeInvest();
            }
        };
    }
}]);