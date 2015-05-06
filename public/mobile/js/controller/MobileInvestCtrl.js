'use strict';
angular.module('mobileApp').controller('MobileInvestCtrl', ['$scope', '$window', '$timeout', '$http', function($scope, $window, $timeout, $http) {
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
        if (vm.user.enableInvest === undefined || vm.user.enableInvest === null) {
            vm.editInvest = false;
        }

        vm.startInvest = function() {
            if (!vm.profit_rate) {
                vm.errorMsg = '请输入期望收益率，0到18之间';
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
                profitRate: vm.profit_rate,
                duration: vm.period,
                enable: true
            };
            $http.post('/api/user/invest_update', data)
                .success(function(data, status) {

                })
                .error(function(data, status) {

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
        }
    }
}]);