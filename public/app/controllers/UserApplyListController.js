'use strict';
angular.module('myApp').controller('UserApplyListController', ['gbIdentity', '$http', 'gbNotifier', '$location', 'gbApply', '$window', 'days', function(gbIdentity, $http, gbNotifier, $location, gbApply, $window, days) {
    var vm = this;
    vm.user = gbIdentity.currentUser;
    var apply_list = {};
    var currentApplies;
    vm.itemsPerPage = 15;

    function pageReset() {
        vm.totalItems = currentApplies.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    function initData() {
        apply_list = gbApply.query({uid:vm.user._id}, function () {
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
            }
        ];
    };

    function formatData (item) {
        item.start_date = item.startTime ? item.startTime : days.startTime();
        item.end_date = item.endTime ? item.endTime : days.endTime(item.start_date, item.period);
        switch (item.status) {
            case 1:
                item.status_str = "待支付";
                break;
            case 2:
                item.status_str = "操盘中";
                break;
            case 3:
                item.status_str = "已结算";
                break;
            case 4:
                item.status_str = "审核中";
                break;
            case 5:
                item.status_str = "失败";
                break;
        }
    };

    initData();

    vm.queryItem = function(item) {
        currentApplies = apply_list.filter(function (elem) {
            if (!item.value) return true;
            return elem.status === item.value;
        });
        pageReset();
    };

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentApplies.slice(start, end);
    };

    vm.manageApply = function(apply) {
        if (apply.status === 1) {
            $window.location.assign('/apply_confirm/' + apply.serialID);
        } else {
            $window.location.assign('/apply_detail/' + apply.serialID);
        }
    };
}]);
