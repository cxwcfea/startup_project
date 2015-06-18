'use strict';
angular.module('mobileApp').controller('MobileInvestRechargeCtrl', ['$scope', '$window', '$location', '$timeout', '$http', function($scope, $window, $location, $timeout, $http) {
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
        vm.rechargeSuccess = false;

        vm.payConfirm = function() {
            if (!vm.invest_amount) {
                vm.errorMsg = '请输入欲投资金额，100元起';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }
            var data = {
                amount: vm.invest_amount
            };
            $http.post('/api/user/invest_recharge', data)
                .success(function(data, status) {
                    vm.rechargeSuccess = true;
                    vm.user.finance.balance -= vm.invest_amount;
                    vm.user.invest.availableAmount += vm.invest_amount;
                })
                .error(function(data, status) {
                    if (status === 403 && data.error_code === 1) {
                        vm.notEnoughMoney = true;
                        $scope.data.intendedRechargeAmount = vm.invest_amount;
                    } else {
                        vm.errorMsg = data.error_msg;
                        vm.inputError = true;
                        $timeout(function() {
                            vm.inputError = false;
                        }, 2000);
                    }
                });
        };

        vm.redirectToRecharge = function() {
            $location.path('/recharge');
        }
    }
}]);
