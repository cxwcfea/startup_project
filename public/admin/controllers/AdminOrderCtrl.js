'use strict';
angular.module('adminApp').controller('AdminOrderCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', 'adminApply', '$filter', function($scope, $location, $routeParams, $modal, $http, gbNotifier, adminApply, $filter) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;
    vm.maxSize = 5;

    vm.queryItems = [
        {
            name: '全部',
            value: 0
        },
        {
            name: '已确认的提现',
            value: 1
        }
    ];

    initData();

    function initData() {
        $http.get('/admin/api/orders/all').success(function(data) {
            order_list = $filter('orderBy')(data, 'createdAt', true);
            currentOrders = order_list;
            pageReset();
        });
    }

    function pageReset() {
        vm.totalItems = currentOrders.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentOrders.slice(start, end);
    };

    vm.queryItem = function (item) {
        if (item.value === 1) {
            currentOrders = order_list.filter(function (elem) {
                return elem.dealType === 2 && elem.status === 1;
            });
        } else {
           currentOrders = order_list;
        }
        pageReset();
    };
}]);

