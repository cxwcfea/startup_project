'use strict';
angular.module('myApp').controller('UserApplyListController', ['gbIdentity', '$http', 'gbNotifier', '$location', 'gbApply', '$window', function(gbIdentity, $http, gbNotifier, $location, gbApply, $window) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.currentApplies = vm.applies.slice(start, end);
    };

    function initData() {
        gbApply.query({uid:vm.user._id}, function (data) {
            angular.forEach(data, function(value, key) {
                formatData(value);
            });
            vm.applies = data;
            vm.totalItems = vm.applies.length;
            vm.currentPage = 1;
            vm.itemsPerPage = 15;
            vm.pageChanged();
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
        var date = moment(item.applyAt);
        item.start_date = date.format("YYYY-MM-DD HH:mm");
        item.end_date = date.add(item.period, 'days').format("YYYY-MM-DD HH:mm");
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
        console.log('run');
        vm.currentApplies = vm.applies.filter(function (elem) {
            if (!item.value) return true;
            return elem.status === item.value;
        });
        vm.totalItems = vm.currentApplies.length;
        vm.currentPage = 1;
    };

    vm.manageApply = function(apply) {
        if (apply.status === 1) {
            $window.location.assign('/apply_confirm/' + apply.serialID);
        } else {
            $window.location.assign('/apply_detail/' + apply.serialID);
        }
    };
}]);
