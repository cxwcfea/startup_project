'use strict';
angular.module('mobileApp').controller('MobileInvestRechargeCtrl', ['$scope', '$window', '$location', '$timeout', function($scope, $window, $location, $timeout) {
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

        vm.payConfirm = function() {
            if (!vm.invest_amount) {
                vm.errorMsg = '请输入预投资金额，100元起';
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

                })
                .error(function(data, status) {

                });
        };
    }
}]);
