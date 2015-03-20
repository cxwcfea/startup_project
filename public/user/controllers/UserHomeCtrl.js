'use strict';
angular.module('userApp').controller('UserHomeCtrl', ['$scope', '$location', '$http', 'days', 'njApply', function($scope, $location, $http, days, njApply) {
    var vm = this;

    vm.user = $scope.data.currentUser;

    vm.user_total_capital = vm.user.finance.balance + vm.user.finance.freeze_capital;

    var apply_list = {};
    var currentApplies;
    vm.itemsPerPage = 6;
    vm.selected = 0;

    initData();

    function pageReset() {
        vm.totalItems = currentApplies.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    function initData() {
        apply_list = njApply.query({uid:vm.user._id}, function () {
            angular.forEach(apply_list, function(value, key) {
                formatData(value);
            });
            currentApplies = apply_list;
            pageReset();
        });

        vm.queryItems = [
            {
                name: '全部',
                value: 0
            },
            {
                name: '待支付',
                value: 1
            },
            {
                name: '当前操盘',
                value: 2
            },
            {
                name: '已结算',
                value: 3
            },
            {
                name: '审核中',
                value: 4
            },
            {
                name: '结算中',
                value: 5
            }
        ];
    }

    function formatData (item) {
        item.start_date = item.startTime ? item.startTime : days.startTime();
        item.end_date = item.endTime ? item.endTime : days.endTime(item.start_date, item.period);
    }

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentApplies.slice(start, end);
    };

    vm.queryItem = function(item) {
        vm.selected = item.value;
        currentApplies = apply_list.filter(function (elem) {
            if (!item.value) return true;
            return elem.status === item.value;
        });
        pageReset();
    };
}]);