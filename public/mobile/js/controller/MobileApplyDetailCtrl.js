'use strict';
angular.module('mobileApp').controller('MobileApplyDetailCtrl', ['$scope', '$window', '$location', '$http', '$timeout', 'days', 'util', function($scope, $window, $location, $http, $timeout, days, util) {
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
        var profit = 0;
        if (vm.apply.profit !== null && vm.apply.profit !== undefined) {
            profit = vm.apply.profit;
        }
        vm.profit = profit >= 0 ? '+' : '';
        vm.profit += profit.toString();
        vm.profit_rate = 0;
        if (profit > 0) {
            vm.profit_rate = profit / vm.apply.deposit * 100;
        }

        vm.serviceFee = vm.apply.isTrial ? 0 : util.getServiceCharge(vm.apply.lever);
        vm.interest = vm.apply.amount * vm.apply.interestRate;
        vm.apply_warn = vm.apply.isTrial ? 1800 : (vm.apply.warnValue ? vm.apply.warnValue : util.getWarnValue(vm.apply.amount, vm.apply.deposit));
        vm.apply_sell = vm.apply.isTrial ? 1600 : (vm.apply.sellValue ? vm.apply.sellValue : util.getSellValue(vm.apply.amount, vm.apply.deposit));
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
