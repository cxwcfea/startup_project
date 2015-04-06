'use strict';
angular.module('mobileApp').controller('MobileApplyListCtrl', ['$scope', '$window', 'njApply', 'warn_factor', 'sell_factor', 'days', function($scope, $window, njApply, warn_factor, sell_factor, days) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    vm.apply_list = {};
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {};
        }
        $scope.data.lastLocation = '/recharge_record';
        $location.path('/login');
    } else {
        vm.apply_list = njApply.query({uid:vm.user._id}, function () {
            angular.forEach(vm.apply_list, function(value, key) {
                formatData(value);
            });
        });
    }

    function formatData (item) {
        item.start_date = item.startTime ? item.startTime : days.startTime();
        item.end_date = item.endTime ? item.endTime : days.endTime(item.start_date, item.period);
        item.days_till_now = days.tradeDaysTillNow(item);
        item.left_days = item.period - item.days_till_now;
        item.apply_warn = item.isTrial ? 1800 : (warn_factor * item.amount).toFixed(2);
        item.apply_sell = item.isTrial ? 1600 : (sell_factor * item.amount).toFixed(2);
    }

}]);