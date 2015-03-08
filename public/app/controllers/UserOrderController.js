'use strict';
angular.module('myApp').controller('UserOrderController', ['gbIdentity', function(gbIdentity) {
    var vm = this;
    var currentOrders;
    vm.user = gbIdentity.currentUser;
    vm.itemsPerPage = 15;

    function initData() {
        currentOrders = vm.user.orders;
        pageReset();

        vm.queryItems = [
            {
                name: '全部',
                value: 0
            },
            {
                name: '充值',
                value: 1
            },
            {
                name: '提现',
                value: 2
            }
        ];
    }

    function pageReset() {
        vm.totalItems = currentOrders.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.queryItem = function (item) {
        currentOrders = vm.user.orders.filter(function (elem) {
            if (item.value === 1) {
                return elem.dealType === '充值';
            }
            if (item.value === 2) {
                return elem.dealType === '提现';
            }
            return true;
        });
        pageReset();
    };

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentOrders.slice(start, end);
    };

    vm.formatDate = function(dateStr) {
        return moment(dateStr).format("YYYY-MM-DD HH:mm");
    };

    initData();
}]);
