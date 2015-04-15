'use strict';
angular.module('adminApp').controller('AdminWithdrawOrderCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', 'gbUser', function($scope, $location, $routeParams, $modal, $http, gbNotifier, gbUser) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;
    var currentUser = null;

    initData();

    function initData() {
        $http.get('/admin/api/orders/withdraw').success(function(data) {
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
        var modalInstance = $modal.open({
            templateUrl: 'withdrawOrderDeleteModal.html',
            controller: 'withdrawOrderDeleteModalCtrl',
            resolve: {
                order: function () {
                    return order;
                }
            }
        });
        modalInstance.result.then(function (trans_id) {
            $http.post('/admin/api/delete_withdraw_order/' + order._id, {})
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

    vm.handleOrder = function(order) {
        currentUser = null;
        gbUser.get({id:order.userID}, function(user) {
            currentUser = user;
        });
        var modalInstance = $modal.open({
            templateUrl: '/views/withdrawModal.html',
            controller: 'WithdrawModalCtrl',
            resolve: {
                order: function () {
                    return order;
                }
            }
        });
        modalInstance.result.then(function (result) {
            if (!result.bank_trans_id) {
                gbNotifier.error('必须输入银行单号！');
                return;
            }
            if (!currentUser) {
                gbNotifier.error('数据还未准备好，请稍后再试！');
                return;
            }

            var data = {
                uid: order.userID,
                bank_trans_id: result.bank_trans_id
            };

            $http.post('/admin/api/user/withdraw/' + order._id, data)
                .success(function(data, status, headers, config) {
                    order = data;
                    gbNotifier.notify('更新成功');
                    currentUser.finance.freeze_capital -= order.amount;
                    var data = {
                        user_mobile: currentUser.mobile,
                        sms_content: result.sms_content.replace('BALANCE', currentUser.finance.balance.toFixed(2))
                    };
                    $http.post('/admin/api/send_sms', data)
                        .then(function(response) {
                            if (response.data.success) {
                                gbNotifier.notify('短信已发送');
                            } else {
                                gbNotifier.error('短信发送失败:' + response.data.reason);
                            }
                        });
                }).
                error(function(data, status, headers, config) {
                    gbNotifier.error('更新失败:' + data.error_msg);
                });
        }, function () {
        });
    };
}]);

angular.module('adminApp').controller('withdrawOrderDeleteModalCtrl', ['$scope', '$modalInstance', 'order', function ($scope, $modalInstance, order) {
    $scope.amount = order.amount;
    $scope.bank = order.cardInfo.bank;
    $scope.bankName = order.cardInfo.bankName;
    $scope.cardID = order.cardInfo.cardID;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
