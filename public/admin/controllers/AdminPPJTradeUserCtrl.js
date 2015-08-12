'use strict';
angular.module('adminApp').controller('AdminPPJTradeUserCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', function($scope, $location, $routeParams, $modal, $http, gbNotifier) {
    var users = {};
    $scope.currentUsers;
    $scope.itemsPerPage = 15;

    initData();

    $scope.queryItems = [
        {
            name: '全部',
            value: 0
        },
        {
            name: '未签署协议',
            value: 1
        },
        {
            name: '未分配账户',
            value: 2
        },
        {
            name: '交易未开通',
            value: 3
        },
        {
            name: '交易中',
            value: 4
        },
        {
            name: '结算中',
            value: 5
        }
    ];

    $scope.queryItem = function(item) {
        $scope.currentUsers = users.filter(function (user) {
            if (!item.value) return true;
            return user.wechat.status === item.value;
        });
        pageReset();
    };

    function initData() {
        $http.get('/admin/api/get_ppj_trade_user')
            .success(function(data, status) {
                $scope.currentUsers = users = data;
                pageReset();
            })
            .error(function(data, status) {
                gbNotifier.error('错误:' + data.error_msg);
            });
    }

    function pageReset() {
        $scope.totalItems = $scope.currentUsers.length;
        $scope.currentPage = 1;
        $scope.pageChanged();
    }

    $scope.pageChanged = function() {
        var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        var end = start + $scope.itemsPerPage;
        if (end > $scope.totalItems) {
            end = $scope.totalItems;
        }
        $scope.showingItems = $scope.currentUsers.slice(start, end);
    };

    $scope.approveRealTrade = function(user) {
        var result = prompt('确定吗');
        if (result != null) {
            console.log('yes');
            $http.get('/futures/approve_user/?uid=' + user._id)
                .success(function(data, status) {
                    _.remove(users, function(u) {
                        return u._id === user._id;
                    });
                    $scope.currentUsers = users;
                    pageReset();
                    gbNotifier.notify('成功');
                })
                .error(function(data, status) {
                    gbNotifier.notify('错误:' + data.error_msg);
                });
        } else {
            console.log('no');
        }
    };

    $scope.createOrder = function(user) {
        var modalInstance = $modal.open({
            templateUrl: 'views/ppjOrderModel.html',
            controller: 'CreatePPJOrderModalCtrl',
            resolve: {
                user: function () {
                    return user;
                }
            }
        });

        modalInstance.result.then(function (result) {
            if (!result.order_amount || result.order_amount < 0) {
                gbNotifier.error('请输入有效的订单金额！应填3万');
            } else {
                result.userMobile = user.mobile;
                result.userID = user._id;
                result.mobile = user.wechat.mobile;
                $http.post('/admin/api/create/ppj_order', result)
                    .success(function(data, status) {
                        user.finance.balance = result.order_amount;
                        gbNotifier.notify('订单创建成功！');
                    })
                    .error(function(data, status) {
                        gbNotifier.error('订单创建失败:' + data.error_msg);
                    });
            }
        }, function () {
        });
    };

    $scope.addMoney = function(user) {
        $http.get('/futures/add_money/?uid=' + user._id)
            .success(function(data, status) {
                user.wechat.status = 3;
                user.finance.balance -= 30000;
                gbNotifier.notify('入资成功');
            })
            .error(function(data, status) {
                gbNotifier.error('入资失败:' + data.error_msg);
            });
    };

    $scope.approveToTrade = function(user) {
        $http.post('/futures/change_user_access', {uid:user._id, user_status:4, trader_status:0})
            .success(function(data, status) {
                user.wechat.status = 4;
                gbNotifier.notify('操作成功');
            })
            .error(function(data, status) {
                gbNotifier.error('操作失败:' + data.error_msg);
            });
    };
}]);