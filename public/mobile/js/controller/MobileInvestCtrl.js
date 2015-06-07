'use strict';
angular.module('mobileApp').controller('MobileInvestCtrl', ['$scope', '$window', '$timeout', '$http', '$location', function($scope, $window, $timeout, $http, $location) {
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
        vm.editInvest = true;
        vm.showRateDialog = false;
        if (vm.user.invest.enable === undefined || vm.user.invest.enable === null) {
            vm.editInvest = false;
            // default value
            vm.profit_rate = 15;
            vm.period = 30;
        } else {
            vm.profit_rate = vm.user.invest.profitRate;
            vm.period = vm.user.invest.duration;
        }

        vm.changeInvest = function() {
            console.log(vm.profit_rate);
            console.log(vm.period);
            if (!vm.profit_rate || vm.profit_rate > 20 || vm.profit_rate < 1) {
                vm.errorMsg = '请输入期望收益率，1到20之间';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }
            if (!vm.period || vm.period > 30 || vm.period < 1) {
                vm.errorMsg = '请输入期望项目借款期限，1到30之间';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
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

        vm.startInvest = function() {
            if (!vm.user.identity.id) {
                vm.showIdentityDialog = true;
                return;
            }
            if (!vm.profit_rate) {
                vm.errorMsg = '请输入期望收益率，1到20之间';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }
            if (!vm.period) {
                vm.errorMsg = '请输入期望项目借款期限，1到30之间';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }

            var data = {
                invest: {
                    profitRate: vm.profit_rate,
                    duration: vm.period,
                    enable: true
                }
            };
            $http.post('/api/user/invest_update', data)
                .success(function(data, status) {
                    vm.showConfirmDialog = true;
                    vm.user.invest.enable = true;
                })
                .error(function(data, status) {
                    vm.errorMsg = data.error_msg;
                    vm.inputError = true;
                    $timeout(function() {
                        vm.inputError = false;
                    }, 1500);
                });
            /*
            if (!vm.amount) {
                vm.errorMsg = '请输入预投资本金，最少100元';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }
            if (vm.user.finance.balance < vm.amount) {
            }
            */
        };

        vm.closeDialogWindow = function() {
            vm.showRateDialog = false;
            vm.showConfirmDialog = false;
            vm.showPeriodDialog = false;
        };

        vm.confirmInvest = function() {
            vm.editInvest = true;
            vm.closeDialogWindow();
        };

        vm.rechargeToInvestAccount = function() {
            $location.path('/invest_recharge');
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

        vm.redirectToIdentity = function() {
            $location.path('/account');
        };
    }
}]);