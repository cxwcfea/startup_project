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
        },
        {
            name: '账户未入资',
            value: 6
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
        var result = prompt('确定入资吗, 3万元本金将打入交易账户');
        if (result != null) {
            $http.get('/futures/add_money/?uid=' + user._id)
                .success(function(data, status) {
                    user.wechat.status = 3;
                    user.finance.balance -= 30000;
                    gbNotifier.notify('入资成功');
                })
                .error(function(data, status) {
                    gbNotifier.error('入资失败:' + data.error_msg);
                });
        } else {
            console.log('no');
        }
    };

    $scope.approveToTrade = function(user) {
        var result = prompt('确定开通交易权限吗');
        if (result != null) {
            $http.post('/futures/change_user_access', {uid:user._id, user_status:4, trader_status:0})
                .success(function(data, status) {
                    user.wechat.status = 4;
                    gbNotifier.notify('操作成功');
                })
                .error(function(data, status) {
                    gbNotifier.error('操作失败:' + data.error_msg);
                });
        } else {
            console.log('no');
        }
    };

    $scope.disallowTrade = function(user) {
        var result = prompt('确定冻结账户吗');
        if (result != null) {
            $http.post('/futures/change_user_access', {uid:user._id, user_status:3, trader_status:1})
                .success(function(data, status) {
                    user.wechat.status = 3;
                    gbNotifier.notify('操作成功');
                })
                .error(function(data, status) {
                    gbNotifier.error('操作失败:' + data.error_msg);
                });
        } else {
            console.log('no');
        }
    };

    $scope.closeTrade = function(user) {
        var modalInstance = $modal.open({
            templateUrl: 'views/applyClosingModal.html',
            controller: 'ApplyClosingModalCtrl',
            resolve: {}
        });

        modalInstance.result.then(function (result) {
            if (result.profit === null || result.profit === undefined) {
                gbNotifier.error('必须输入盈亏金额');
                return;
            }
            var postData = {
                uid: user._id,
                profit: result.profit
            };
            $http.post('/futures/finish_trade', postData)
                .success(function(data, status, headers, config) {
                    user.finance.balance = data.balance;
                    user.wechat.real_trader.lastCash = 0;
                    user.wechat.deposit = 0;
                    user.wechat.real_trader.cash = 0;
                    gbNotifier.notify('结算成功');
                }).
                error(function(data, status, headers, config) {
                    gbNotifier.error('结算失败:' + data.error_msg);
                });
        }, function () {
        });
    };

    $scope.withdraw = function(user) {
        var result = prompt('确定所有余额提现吗');
        if (result != null) {
            $http.post('/futures/withdraw', {uid:user._id})
                .success(function(data, status) {
                    user.finance.balance = 0;
                    gbNotifier.notify('成功');
                })
                .error(function(data, status) {
                    gbNotifier.notify('失败:' + data.error_msg);
                });
        } else {
            console.log('no');
        }
    };

    $scope.addCard = function(user) {
        var modalInstance = $modal.open({
            templateUrl: 'views/addCardModal.html',
            controller: 'AddCardModalCtrl',
            resolve: {
                user: function () {
                    return user;
                }
            }
        });

        modalInstance.result.then(function (result) {
            if (!result.cardID) {
                gbNotifier.error('必须输入银行卡信息');
                return;
            }
            var regex = /^(\d{12}|\d{16}|\d{17}|\d{18}|\d{19})$/;
            if (!regex.test(result.cardID)) {
                gbNotifier.error('银行卡号格式不正确');
                return;
            }
            if (!result.name) {
                gbNotifier.error('必须输入持卡人信息');
                return;
            }
            result.uid = user._id;
            result.userMobile = user.wechat.mobile;
            $http.post('/futures/addCard', result)
                .success(function(data, status) {
                    gbNotifier.notify('添加成功');
                })
                .error(function(data, status) {
                    gbNotifier.notify('添加失败');
                });
        }, function () {
        });
    };

    $scope.showUserDetail = function(mobile) {
        $scope.data.searchKey = mobile;
        $location.path('user_page');
    };

    $scope.createTradeAccount = function(user) {
        var result = prompt('确定为该用户创建交易账户吗?');
        if (result != null) {
            $http.get('/futures/create_account/?uid=' + user._id)
                .success(function(data, status) {
                    user.wechat.status = 3;
                    gbNotifier.notify('创建成功');
                })
                .error(function(data, status) {
                    gbNotifier.error('账户创建失败:' + data.error_msg);
                });
        } else {
            console.log('no');
        }
    };
}]);