'use strict';
angular.module('supportApp').controller('SupportOrderCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', 'supportApply', '$filter', function($scope, $location, $routeParams, $modal, $http, gbNotifier, supportApply, $filter) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;

    initData();

    function initData() {
        $http.get('/admin/api/orders/all').success(function(data) {
            order_list = data;
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

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentOrders.slice(start, end);
    };

    vm.takeOrder = function(order) {
        $http.post('/admin/api/take_order', {id:order._id})
            .success(function(data, status) {
                order.manager = data.manager;
                gbNotifier.notify('更新成功!');
            })
            .error(function(data, status) {
                gbNotifier.error('更新失败!');
            });
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
        modalInstance.result.then(function (trans_id) {
            if (!trans_id) {
                gbNotifier.error('必须输入支付宝转账单号');
                return;
            }
            $http.post('/admin/api/confirm_alipay_order/' + order._id, {trans_id:trans_id})
                .success(function(data, status) {
                    gbNotifier.notify('确认成功');
                })
                .error(function(data, status) {
                    console.log(data.error_msg);
                    gbNotifier.error('发生错误');
                });
        }, function () {
        });
    };

    vm.takeOrder = function(order) {
        $http.post('/admin/api/take_order', {id:order._id})
            .success(function(data, status) {
                order.manager = data.manager;
                gbNotifier.notify('更新成功!');
            })
            .error(function(data, status) {
                gbNotifier.error('更新失败!');
            });
    };

    vm.deleteOrder = function(order) {
        var modalInstance = $modal.open({
            templateUrl: 'alipayOrderDeleteModal.html',
            controller: 'alipayOrderDeleteModalCtrl',
            resolve: {
                order: function () {
                    return order;
                }
            }
        });
        modalInstance.result.then(function (trans_id) {
            $http.post('/admin/api/delete_alipay_order/' + order._id, {})
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

angular.module('supportApp').controller('alipayOrderModalCtrl', ['$scope', '$modalInstance', 'order', function ($scope, $modalInstance, order) {
    $scope.amount = order.amount;
    $scope.account = order.otherInfo;
    $scope.name = order.transID;

    $scope.ok = function () {
        $modalInstance.close($scope.trans_id);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('supportApp').controller('alipayOrderDeleteModalCtrl', ['$scope', '$modalInstance', 'order', function ($scope, $modalInstance, order) {
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
