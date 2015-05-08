'use strict';
angular.module('adminApp').controller('AdminWaitingCompleteWithdrawOrderCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', 'gbUser', function($scope, $location, $routeParams, $modal, $http, gbNotifier, gbUser) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;
    var currentUser = null;

    initData();

    function initData() {
        $http.get('/admin/api/orders/waiting_complete_withdraw').success(function(data) {
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

    vm.startToPay = function() {
        console.log('startToPay');
        while (order_list.length) {
            var order = order_list.pop();
            /*
            $('#order_id')[0].value = order._id;
            $('#bank')[0].value = order.cardInfo.bank;
            $('#bank_name')[0].value = order.cardInfo.bankName;
            $('#user_name')[0].value = order.cardInfo.userName;
            $('#card_id')[0].value = order.cardInfo.cardID;
            $('#amount')[0].value = order.amount.toFixed(2);
            $('#handle_withdraw_order_form')[0].submit();
            */
            /*
            var data = {
                order_id: order._id,
                bank: order.cardInfo.bank,
                bank_name: order.cardInfo.bankName,
                user_name: order.cardInfo.userName,
                card_id: order.cardInfo.cardID,
                amount: order.amount.toFixed(2)
            };
            */
            $http.post('/admin/api/handle_with_draw_order', order)
                .success(function(data, status) {
                    gbNotifier.notify('成功');
                })
                .error(function(data, status) {
                    gbNotifier.error('失败');
                });
        }
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
