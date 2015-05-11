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

    vm.approveOrder = function(order) {
        console.log('approve order');
        $http.post('/admin/api/approve_with_draw_order/' + order._id, {})
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

    vm.sendSMS = function(order) {
        var modalInstance = $modal.open({
            templateUrl: '/views/smsModal.html',
            controller: 'withdrawSMSCtrl',
            //size: size,
            resolve: {
                order: function() {
                    return order;
                }
            }
        });

        modalInstance.result.then(function (content) {
            vm.sms_content = content;
            var data = {
                user_mobile: order.userMobile,
                sms_content: vm.sms_content
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
}]);

angular.module('adminApp').controller('withdrawSMSCtrl', ['$scope', '$modalInstance', 'order', function ($scope, $modalInstance, order) {
    $scope.ok = function () {
        $modalInstance.close($scope.sms_content);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
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

angular.module('adminApp').controller('orderHistoryModalCtrl', ['$scope', '$modalInstance', 'order', 'orders', 'user', function ($scope, $modalInstance, order, orders, user) {
    $scope.userMobile = order.userMobile;
    $scope.amount = order.amount;
    if (user) {
        $scope.deposit = user.finance.deposit;
    }
    $scope.rechargeOrders = orders.filter(function(elem) {
        return elem.dealType === 1;
    });
    $scope.withdrawOrders = orders.filter(function(elem) {
        return elem.dealType === 2;
    });
    $scope.profitOrders = orders.filter(function(elem) {
        return elem.dealType === 4;
    });
    $scope.profitAmount = 0;
    $scope.profitOrders.map(function(elem) {
        $scope.profitAmount += elem.amount;
    });
    $scope.rechargeAmount = 0;
    $scope.rechargeOrders.map(function(elem) {
        $scope.rechargeAmount += elem.amount;
    });
    $scope.withdrawAmount = 0;
    $scope.withdrawOrders.map(function(elem) {
        $scope.withdrawAmount += elem.amount;
    });
    $scope.delta = $scope.rechargeAmount + $scope.profitAmount - $scope.withdrawAmount;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
