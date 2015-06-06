'use strict';
angular.module('adminApp').controller('AdminFreezeWithdrawOrderListCtrl', ['$scope', '$location', '$modal', '$http', 'gbNotifier', 'gbUser', function($scope, $location, $modal, $http, gbNotifier, gbUser) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;
    var currentUser = null;

    initData();

    function initData() {
        $http.get('/admin/api/orders/freeze_withdraw_order').success(function(data) {
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

    vm.removeOrder = function(order) {
        $http.post('/admin/api/reject_withdraw_order/' + order._id, {})
            .success(function(data, status, headers, config) {
                gbNotifier.notify('更新成功');
                _.remove(order_list, function(o) {
                    return o._id === order._id;
                });
                currentOrders = order_list;
                pageReset();
            }).
            error(function(data, status, headers, config) {
                gbNotifier.error('更新失败:' + data.error_msg);
            });
    };

    vm.handleOrder = function(order) {
        order.status = 0;
        $http.post('/admin/api/orders/' + order._id, order)
            .success(function(data, status) {
                gbNotifier.notify('更新成功');
                _.remove(order_list, function(o) {
                    return o._id === order._id;
                });
                currentOrders = order_list;
                pageReset();
            })
            .error(function(data, status) {
                gbNotifier.error('更新失败:' + data.error_msg);
            });
    };

    vm.orderHistory = function(order) {
        gbUser.get({id:order.userID}, function(user) {
            currentUser = user;
        });
        $http.get('/admin/api/fetch_user_order_history?user_id=' + order.userID)
            .success(function(data, status) {
                var modalInstance = $modal.open({
                    templateUrl: 'orderHistoryModal.html',
                    controller: 'orderHistoryModalCtrl',
                    size:'lg',
                    resolve: {
                        order: function () {
                            return order;
                        },
                        orders: function () {
                            return data;
                        },
                        user: function () {
                            return currentUser;
                        }
                    }
                });
                modalInstance.result.then(function (trans_id) {
                }, function () {
                });
            })
            .error(function(data, status) {
                console.log(data);
            });
    };
}]);