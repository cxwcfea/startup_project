'use strict';
angular.module('mobileApp').controller('MobileAddDepositCtrl', ['$scope', '$window', '$timeout', function($scope, $window, $timeout) {
    var vm = this;

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
    }
}]);