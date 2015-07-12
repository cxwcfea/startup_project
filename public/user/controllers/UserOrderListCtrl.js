'use strict';
angular.module('userApp').controller('UserOrderListCtrl', ['$scope', '$http', '$window', '$location', '$routeParams', '$filter', 'njOrder', 'njCard', 'BankNameList', 'gbNotifier', 'njCachedCards', function($scope, $http, $window, $location, $routeParams, $filter, njOrder, njCard, BankNameList, gbNotifier, njCachedCards) {
    var vm = this;

    $scope.data.menu = 3;
    vm.user = $scope.data.currentUser;

    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 6;
    vm.selected = 0;
    vm.haveOrder = false;
    vm.maxSize = 3;

    initData();

    function initData() {
        order_list = njOrder.query({uid:vm.user._id}, function () {
            if (order_list.length > 0) {
                vm.haveOrder = true;
            }
            order_list = $filter('orderBy')(order_list, 'createdAt', true);
            currentOrders = order_list;
            pageReset();
        });
    }

    function pageReset() {
        vm.totalItems = currentOrders.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.queryItem = function (item) {
        vm.selected = item.value;
        currentOrders = order_list.filter(function (elem) {
            if (!item.value) return true;
            if (item.value === 1) {
                return elem.dealType === 1 || elem.dealType === 2;
            } else if (item.value === 2) {
                return elem.dealType === 5 || elem.dealType === 9;
            } else {
                return elem.dealType === 8 || elem.dealType === 10;
            }
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

    vm.queryItems = [
        {
            name: '全部',
            value: 0
        },
        {
            name: '充值提现',
            value: 1
        },
        {
            name: '融资明细',
            value: 2
        },
        {
            name: '管理费明细',
            value: 3
        }
    ];

    vm.alerts = [];

    var addAlert = function(type, msg) {
        vm.alerts = [];
        vm.alerts.push({type:type, msg: msg});
    };

    vm.closeAlert = function(index) {
        vm.alerts.splice(index, 1);
    };

    vm.showAddCard = function() {
        vm.alerts = [];
        vm.currentCategory = vm.categories[3];
    };


}]);