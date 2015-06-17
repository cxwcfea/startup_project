'use strict';
angular.module('mobileApp').controller('MobileInvestCtrl', ['$scope', '$window', '$timeout', '$http', '$location', function($scope, $window, $timeout, $http, $location) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    vm.inputError = false;
    vm.showRateDialog = false;
    if (!vm.user || vm.user.invest.enable === undefined || vm.user.invest.enable === null) {
        // default value
        vm.profit_rate = 12;
        vm.period = 30;
    } else {
        vm.profit_rate = vm.user.invest.profitRate;
        vm.period = vm.user.invest.duration;
    }

    vm.closeDialogWindow = function() {
        vm.showRateDialog = false;
        vm.showConfirmDialog = false;
        vm.showPeriodDialog = false;
    };

    vm.rechargeToInvestAccount = function() {
        if (!vm.user) {
            if (!$scope.data) {
                $scope.data = {}
            }
            $scope.data.lastLocation = '/invest';
            $location.path('/login');
            return;
        }

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

    vm.redirectToIdentity = function() {
        $location.path('/identity');
    };

    vm.redirectToInvestSetting = function() {
        if (!vm.user) {
            if (!$scope.data) {
                $scope.data = {};
            }
            $scope.data.lastLocation = '/invest';
            $location.path('/login');
            return;
        }
        if (!vm.user.identity.id) {
            vm.showIdentityDialog = true;
            return;
        }
        $location.path('/invest_setting');
    }
}]);