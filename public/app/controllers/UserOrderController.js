'use strict';
angular.module('myApp').controller('UserOrderController', ['gbIdentity', function(gbIdentity) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    /*
    angular.forEach(vm.user.orders, function(value, key) {
        this.push(key + ': ' + value);
    }, log);
    */

    vm.totalItems = vm.user.orders.length;
    vm.currentPage = 1;
    vm.itemsPerPage = 15;
    //vm.maxSize = 5;

    vm.change = function () {
        vm.currentOrders = vm.user.orders.filter(function (elem) {
            if (vm.orderType === 'pay') {
                return elem.dealType === '充值';
            }
            if (vm.orderType === 'withdraw') {
                return elem.dealType === '提现';
            }
            return true;
        });
        vm.totalItems = vm.currentOrders.length;
        vm.currentPage = 1;
    };

    vm.setPage = function (pageNo) {
        vm.currentPage = pageNo;
    };

    vm.pageChanged = function() {
        var start = 0 + (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.currentOrders = vm.user.orders.slice(start, end);
    };

    vm.pageChanged();

    vm.formatDate = function(dateStr) {
        return moment(dateStr).format("YYYY-MM-DD HH:mm");
    }
}]);
