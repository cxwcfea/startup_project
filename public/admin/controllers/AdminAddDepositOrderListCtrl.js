'use strict';
angular.module('adminApp').controller('AdminAddDepositOrderListCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', 'adminApply', function($scope, $location, $routeParams, $modal, $http, gbNotifier, adminApply) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;

    initData();

    function initData() {
        $http.get('/admin/api/orders/add_deposit').success(function(data) {
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
        adminApply.get({id:order.applySerialID, uid:order.userID}, function(apply) {
            var modalInstance = $modal.open({
                templateUrl: 'addDepositInfoModal.html',
                controller: 'AddDepositInfoModalCtrl',
                resolve: {
                    order: function () {
                        return order;
                    },
                    apply: function() {
                        return apply;
                    }
                }
            });
            modalInstance.result.then(function () {
                order.dealType = 9;
                order.payType = 7;
                $http.post('/admin/api/orders/' + order._id, order)
                    .success(function(data, status) {
                        gbNotifier.notify('订单更新成功');
                        _.remove(order_list, function(o) {
                            return o._id === order._id;
                        });
                        currentOrders = order_list;
                        pageReset();
                    })
                    .error(function(data, status) {
                        gbNotifier.error('订单更新失败');
                    });
            }, function () {
            });
        });
    };
}]);

angular.module('adminApp').controller('AddDepositInfoModalCtrl', ['$scope', '$modalInstance', 'order', 'apply', function ($scope, $modalInstance, order, apply) {
    $scope.userMobile = order.userMobile;
    $scope.homsAccount = apply.account;
    $scope.amount = order.amount;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);