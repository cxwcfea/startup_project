'use strict';
angular.module('myApp').controller('UserOrderController', ['$window', 'gbIdentity', 'gbOrder', function($window, gbIdentity, gbOrder) {
    var vm = this;
    var currentOrders;
    var order_list;
    vm.user = gbIdentity.currentUser;
    vm.itemsPerPage = 15;

    function initData() {
        order_list = gbOrder.query({uid:vm.user._id}, function () {
            currentOrders = order_list;
            pageReset();
        });

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
            },
            {
                name: '盈利提取',
                value: 3
            },
            {
                name: '股票盈利',
                value: 4
            },
            {
                name: '保证金返还',
                value: 5
            },
            {
                name: '追加配资保证金',
                value: 6
            }
        ];
    }

    function pageReset() {
        vm.totalItems = currentOrders.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.queryItem = function (item) {
        currentOrders = order_list.filter(function (elem) {
            if (!item.value) return true;
            return elem.dealType === item.value;
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

    vm.manageOrder = function(order) {
        if (!order.status && order.dealType === 1) {
            $window.location.assign('/pay_confirm/' + order._id);
        }
    };

    initData();
}]);
