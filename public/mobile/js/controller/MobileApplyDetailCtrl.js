'use strict';
angular.module('mobileApp').controller('MobileApplyDetailCtrl', ['$scope', '$window', '$location', '$http', '$timeout', 'warn_factor', 'sell_factor', 'days', function($scope, $window, $location, $http, $timeout, warn_factor, sell_factor, days) {
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
        vm.apply = $window.bootstrappedApplyObject;
        vm.apply.start_date = vm.apply.startTime ? vm.apply.startTime : days.startTime();
        vm.apply.end_date = vm.apply.endTime ? vm.apply.endTime : days.endTime(vm.apply.start_date, vm.apply.period);
        vm.days_till_now = days.tradeDaysTillNow(vm.apply);

        vm.finalValue = vm.apply.deposit + vm.apply.profit;
        if (vm.finalValue < 0) {
            vm.finalValue = 0;
        }
        vm.profit = vm.apply.profit >= 0 ? '+' : '';
        vm.profit += vm.apply.profit.toString();
        vm.profit_rate = 0;
        if (vm.apply.profit > 0) {
            vm.profit_rate = vm.apply.profit / vm.apply.deposit * 100;
        }

        vm.serviceFee = vm.apply.isTrial ? 0 : 19.90;
        vm.apply_warn = vm.apply.isTrial ? 1800 : (warn_factor * vm.apply.amount).toFixed(2);
        vm.apply_sell = vm.apply.isTrial ? 1600 : (sell_factor * vm.apply.amount).toFixed(2);
    }

    vm.requestClose = function() {
        vm.showCloseWindow = true;
    };

    vm.closeApply = function() {
        $http.post('/user/apply_close/' + vm.apply.serialID, {})
            .success(function(data, status, headers, config) {
                vm.apply.status = 5;
                vm.resultSuccess = true;
                $timeout(function() {
                    vm.resultSuccess = false;
                }, 2500);
                vm.showCloseWindow = false;
            })
            .error(function(data, status, headers, config) {
                vm.errorMsg = '结算申请提交失败，请稍后重试';
                vm.resultError = true;
                $timeout(function() {
                    vm.resultError = false;
                }, 2500);
                vm.showCloseWindow = false;
            });
    };
}]);
