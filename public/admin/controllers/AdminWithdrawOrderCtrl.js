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

    vm.handleOrder = function(order) {
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
            order.bankTransID = result.bank_trans_id;
            order.status = 1;

            $http.post('/admin/api/orders/:id', order)
                .success(function(data, status, headers, config) {
                    order = data;
                    gbNotifier.notify('更新成功');
                }).
                error(function(data, status, headers, config) {
                    gbNotifier.error('结算失败:' + data.reason);
                    gbNotifier.error('更新失败:' + data.reason);
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
    };
}]);
