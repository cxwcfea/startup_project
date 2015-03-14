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
            if (item.value === 1) {
                return elem.dealType === 1;
            }
            if (item.value === 2) {
                return elem.dealType === 2;
            }
            return true;
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
                templateUrl: 'withdrawModal.html',
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

angular.module('adminApp').controller('WithdrawModalCtrl', ['$scope', '$modalInstance', 'order', 'withdraw_sms_content', function ($scope, $modalInstance, order, withdraw_sms_content) {
    $scope.data = {};
    $scope.bankName = order.cardInfo.bankName;
    $scope.cardID = order.cardInfo.cardID;
    $scope.userName = order.cardInfo.userName;
    $scope.data.sms_content = withdraw_sms_content;

    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);