'use strict';
angular.module('adminApp').controller('AdminOrderListCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'adminOrder', 'gbNotifier', 'gbUser', function($scope, $location, $routeParams, $modal, $http, adminOrder, gbNotifier, gbUser) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;
    var currentUser = $scope.data.selectedUser;

    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/orders/") == 0) {
            var id = $routeParams["uid"];
            initData(id);
        }
    });

    function initData(id) {
        order_list = adminOrder.query({uid:id}, function () {
            currentOrders = order_list;
            pageReset();
        });

        if (!currentUser) {
            gbUser.get({id:id}, function(user) {
                currentUser = user;
            });
        }

        vm.queryItems = [
            {
                name: '全部',
                value: 0
            },
            {
                name: '充值',
                value: 1
            },
            {
                name: '提现',
                value: 2
            },
            /*
            {
                name: '盈利提取',
                value: 3
            },
            {
                name: '股票盈利',
                value: 4
            },
            {
                name: '保证金返还',
                value: 5
            },
            {
                name: '追加配资保证金',
                value: 6
            },
            */
            {
                name: '交易完成',
                value: 7
            }
        ];
    }

    function pageReset() {
        vm.totalItems = currentOrders.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.queryItem = function (item) {
        currentOrders = order_list.filter(function (elem) {
            if (!item.value) return true;
            if (item.value === 7) {
                return elem.status === 1;
            }
            return elem.dealType === item.value;
        });
        pageReset();
    };

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

    vm.showDetail = function(order) {
        alert(order.description);
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