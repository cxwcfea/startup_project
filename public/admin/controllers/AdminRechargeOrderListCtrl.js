'use strict';
angular.module('adminApp').controller('AdminRechargeOrderListCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', 'adminApply', '$filter', function($scope, $location, $routeParams, $modal, $http, gbNotifier, adminApply, $filter) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;

    initData();

    function initData() {
        $http.get('/admin/api/orders/recharge').success(function(data) {
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

    vm.handleOrder = function(order) {
        var modalInstance = $modal.open({
            templateUrl: 'rechargeOrderModal.html',
            controller: 'rechargeOrderModalCtrl',
            resolve: {
                order: function () {
                    return order;
                }
            }
        });
        modalInstance.result.then(function () {
            $http.post('/admin/api/confirm_recharge_order/' + order._id, {})
                .success(function(data, status) {
                    gbNotifier.notify('确认成功');
                    _.remove(order_list, function(o) {
                        return o._id === order._id;
                    });
                    currentOrders = order_list;
                    pageReset();
                })
                .error(function(data, status) {
                    console.log(data.error_msg);
                    gbNotifier.error('发生错误');
                });
        }, function () {
        });
    };

    vm.deleteOrder = function(order) {
        var modalInstance = $modal.open({
            templateUrl: 'rechargeOrderDeleteModal.html',
            controller: 'rechargeOrderDeleteModalCtrl',
            resolve: {
                order: function () {
                    return order;
                }
            }
        });
        modalInstance.result.then(function (trans_id) {
            $http.post('/admin/api/delete_recharge_order/' + order._id, {})
                .success(function(data, status) {
                    gbNotifier.notify('删除成功');
                    _.remove(order_list, function(o) {
                        return o._id === order._id;
                    });
                    currentOrders = order_list;
                    pageReset();
                })
                .error(function(data, status) {
                    console.log(data.error_msg);
                    gbNotifier.error('发生错误');
                });
        }, function () {
        });
    };
}]);

angular.module('adminApp').controller('rechargeOrderModalCtrl', ['$scope', '$modalInstance', 'order', function ($scope, $modalInstance, order) {
    $scope.name = order.userMobile;
    $scope.trans_id = order.bankTransID;
    $scope.amount = order.amount;
    $scope.description = order.description;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('adminApp').controller('rechargeOrderDeleteModalCtrl', ['$scope', '$modalInstance', 'order', function ($scope, $modalInstance, order) {
    $scope.name = order.userMobile;
    $scope.trans_id = order.bankTransID;
    $scope.amount = order.amount;
    $scope.description = order.description;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
