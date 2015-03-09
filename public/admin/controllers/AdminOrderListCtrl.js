'use strict';
angular.module('adminApp').controller('AdminOrderListCtrl', ['$scope', '$location', '$routeParams', 'adminOrder', function($scope, $location, $routeParams, adminOrder) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;

    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/orders/") == 0) {
            var id = $routeParams["uid"];
            initData(id);
        }
    });

    function initData(id) {
        order_list = adminOrder.query({uid:id}, function () {
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
}]);