'use strict';
angular.module('adminApp').controller('AdminOrderListOfAlipayCtrl', ['$scope', '$location', '$resource', '$modal', '$http', 'adminOrder', 'gbNotifier', 'gbUser', function($scope, $location, $resource, $modal, $http, adminOrder, gbNotifier, gbUser) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;

    initData();

    function initData() {
        var AlipayOrder = $resource('/admin/api/alipay_orders', {});
        order_list = AlipayOrder.query({}, function () {
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
        if (order.dealType === 2) {
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
                order.bankTransID = result.bank_trans_id;
                order.status = 1;
                order.$save(function(o) {
                    currentUser.finance.freeze_capital -= order.amount;
                    currentUser.$save(function(u) {
                        gbNotifier.notify('更新成功');
                    }, function(err) {
                        gbNotifier.error('更新失败:' + err.toString());
                    });
                }, function(err) {
                    gbNotifier.error('更新失败:' + err.toString());
                });
                var data = {
                    user_mobile: currentUser.mobile,
                    sms_content: result.sms_content
                };
                $http.post('/admin/api/send_sms', data)
                    .then(function(response) {
                        if (response.data.success) {
                            gbNotifier.notify('短信已发送');
                        } else {
                            gbNotifier.error('短信发送失败:' + response.data.reason);
                        }
                    });
            }, function () {
            });
        }
    };
}]);

angular.module('adminApp').controller('WithdrawModalCtrl', ['$scope', '$modalInstance', 'order', 'sms_macro', function ($scope, $modalInstance, order, sms_macro) {
    $scope.data = {};
    $scope.bank = order.cardInfo.bank;
    $scope.bankName = order.cardInfo.bankName;
    $scope.cardID = order.cardInfo.cardID;
    $scope.userName = order.cardInfo.userName;
    $scope.userMobile = order.userMobile;
    $scope.data.sms_content = sms_macro[7].content.replace('AMOUNT', order.amount);

    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);