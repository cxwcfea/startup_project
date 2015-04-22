'use strict';
angular.module('mobileApp').controller('MobileAddDepositCtrl', ['$scope', '$window', '$timeout', '$http', '$location', function($scope, $window, $timeout, $http, $location) {
    var vm = this;

    vm.success = false;
    vm.user = $window.bootstrappedUserObject;
    vm.showCloseWindow = false;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {};
        }
        $scope.data.lastLocation = '/user_ttn_info';
        $location.path('/login');
    } else {
        vm.apply = $scope.data.currentApply;
        if (!vm.apply) {
            $location.path('/user_ttn');
        }
    }

    vm.addDeposit = function() {
        if (!vm.pay_amount) {
            vm.errorMsg = '请输入有效的金额';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 2500);
            return;
        }
        $http.post("/apply/add_deposit/"+vm.apply.serialID, {deposit_amount:vm.pay_amount})
            .success(function(data, status) {
                if (data.paid) {
                    vm.success = true;
                    $timeout(function() {
                        vm.success = false;
                        $window.location.assign('/mobile/#/user_ttn_info/' + vm.apply.serialID);
                    }, 2000);
                } else {
                    vm.errorMsg = '余额不足，请先充值';
                    vm.inputError = true;
                    $timeout(function() {
                        vm.inputError = false;
                    }, 2500);
                    return;
                }
            })
            .error(function(data, status) {
                vm.errorMsg = '追加失败 ' + data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 2500);
                return;
            });
    }
}]);