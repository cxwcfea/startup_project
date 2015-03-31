'use strict';
angular.module('userApp2').controller('UserHomeCtrl2', ['$scope', '$window', '$filter', 'njApply', 'days', function($scope, $window, $filter, njApply, days) {
    var vm = this;

    vm.user = $scope.data.currentUser;

    var apply_list = {};
    vm.currentApplies;

    initData();

    function initData() {
        apply_list = njApply.query({uid:vm.user._id}, function () {
            if (apply_list.length > 0) {
                vm.newUser = false;
            } else {
                vm.newUser = true;
            }
            angular.forEach(apply_list, function(value, key) {
                formatData(value);
            });
            vm.currentApplies = $filter('filter')(apply_list, {status: 2}, true);
            if (vm.currentApplies.length === 0) {
                vm.currentApplies = $filter('filter')(apply_list, {status: 1}, true);
            }
            if (vm.currentApplies.length === 0) {
                vm.currentApplies = $filter('filter')(apply_list, {status: 4}, true);
            }
            if (vm.currentApplies.length === 0) {
                vm.currentApplies = $filter('filter')(apply_list, {status: 5}, true);
            }
            if (vm.currentApplies.length === 0) {
                vm.currentApplies = $filter('filter')(apply_list, {status: 3}, true);
            }
        });
    }

    function formatData (item) {
        item.start_date = item.startTime ? item.startTime : days.startTime();
        item.end_date = item.endTime ? item.endTime : days.endTime(item.start_date, item.period);
    }
}]);
