'use strict';
angular.module('adminApp').controller('AdminAlipayOrderListCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', 'adminApply', function($scope, $location, $routeParams, $modal, $http, gbNotifier, adminApply) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;

    initData();

    function initData() {
        $http.get('/admin/api/orders/alipay').success(function(data) {
            order_list = data;
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

    vm.handleOrder = function(order) {
        var modalInstance = $modal.open({
            templateUrl: 'alipayOrderModal.html',
            controller: 'alipayOrderModalCtrl',
            resolve: {
                order: function () {
                    return order;
                }
            }
        });
        modalInstance.result.then(function () {
            $http.post('/admin/api/confirm_alipay_order/' + order._id, {})
                .success(function(data, status) {
                    gbNotifier.notify('确认成功');
                })
                .error(function(data, status) {
                    gbNotifier.error('发生错误');

                });
        }, function () {
        });
    };
}]);

angular.module('adminApp').controller('alipayOrderModalCtrl', ['$scope', '$modalInstance', 'order', function ($scope, $modalInstance, order) {
    $scope.amount = order.amount;
    $scope.account = order.otherInfo;
    $scope.name = order.transID;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
