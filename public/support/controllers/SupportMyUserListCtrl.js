'use strict';
angular.module('supportApp').controller('SupportMyUserListCtrl', ['$scope', '$http', '$modal', '$location', 'gbUser', 'gbNotifier', '$window', '$filter', function($scope, $http, $modal, $location, gbUser, gbNotifier, $window, $filter) {
    var vm = this;
    $scope.trader_options = ["全部", "操盘中", "已清算"];
    vm.users = gbUser.query(function() {
        vm.user = $window.bootstrappedUserObject;
        var new_users = [];
        for (var key in vm.users) {
            if (vm.users[key].manager == vm.user.mobile) {
              new_users.push(vm.users[key]);
            }
        }
        new_users = $filter('orderBy')(new_users, 'registerAt', true);
        vm.users = new_users;
        vm.resetSearch();
    });

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.currentUsers = vm.users.slice(start, end);
    };

    vm.registerDate = function(date) {
        return moment(date).format("YYYY-MM-DD HH:mm");
    };

    vm.resetSearch = function() {
        vm.search_mobile = '';
        vm.trader_status = '全部';
        vm.profit_begin = '';
        vm.profit_end = '';
        vm.login_begin = '';
        vm.login_end = '';
        vm.register_begin = '';
        vm.register_end = '';
        vm.free_apply = false;
        vm.showAllUsers();
    };

    vm.setLoginRange = function(begin, end) {
        vm.login_begin = begin;
        vm.login_end = end;
    };

    vm.setRegisterRange = function(begin, end) {
        vm.register_begin = begin;
        vm.register_end = end;
    };

    vm.setProfitRange = function(begin, end) {
        vm.profit_begin = begin;
        vm.profit_end = end;
    };

    vm.showAllUsers = function() {
        vm.totalItems = vm.users.length;
        vm.currentPage = 1;
        vm.itemsPerPage = 15;
        vm.pageChanged();
    };

    vm.searchUser = function() {
        var filter_conditions = new Array();
        if (vm.search_mobile) {
            filter_conditions.push('user.mobile==='+vm.search_mobile);
        }
        if (vm.profit_begin !== '' || vm.profit_end !== '') {
            var filter_one = 'user.finance.profit >= 0';
            if (vm.profit_begin) {
                filter_one = 'user.finance.profit >= ' + vm.profit_begin;
            }
            if (vm.profit_end) {
                filter_one += ' && user.finance.profit <= ' + vm.profit_end;
            }
            filter_conditions.push(filter_one);
        }
        if (vm.free_apply) {
            filter_conditions.push('user.freeApply');
        }
        if (vm.trader_status) {
            switch (vm.trader_status) {
                case "操盘中": // 操盘中
                    filter_conditions.push('user.finance.total_capital > 0');
                    break;
                case "已清算": // 已清算
                    filter_conditions.push('user.finance.total_capital === 0 && user.finance.history_capital > 0');
                    break;
            }
        }
        var user_ret = [];
        if (filter_conditions.length > 0) {
            var filter_string = filter_conditions.join(' && ');
            // console.log(filter_string);
            vm.getUserInFilter(filter_string);
            // console.log('Got ' + vm.currentUsers.length + " users from string filter!");
            user_ret = vm.currentUsers;
        } else {
            user_ret = vm.users;
        }
        if (vm.login_begin || vm.login_end) {
            vm.currentUsers = [];
            var time_begin = new Date();
            var time_end = new Date('2000-01-01 00:00:00');
            if (vm.login_begin) {
                time_begin.setDate(time_begin.getDate()-1*vm.login_begin);
            }
            if (vm.login_end) {
                var time_end = new Date();
                time_end.setDate(time_end.getDate()-1*vm.login_end);
            }
            for (var key in user_ret) {
                var user = user_ret[key];
                var user_date = new Date(user['lastLoginAt']);
                if (user_date >= time_end && user_date <= time_begin) {
                    vm.currentUsers.push(user);
                }
            }
            user_ret = vm.currentUsers;
        }
        if (vm.register_begin || vm.register_end) {
            vm.currentUsers = [];
            var time_begin = new Date();
            var time_end = new Date('2000-01-01 00:00:00');
            if (vm.register_begin) {
                time_begin.setDate(time_begin.getDate()-1*vm.register_begin);
            }
            if (vm.register_end) {
                var time_end = new Date();
                time_end.setDate(time_end.getDate()-1*vm.register_end);
            }
            for (var key in user_ret) {
                var user = user_ret[key];
                var user_date = new Date(user['registerAt']);
                if (user_date >= time_end && user_date <= time_begin) {
                    vm.currentUsers.push(user);
                }
            }
            user_ret = vm.currentUsers;
        }
        vm.currentUsers = user_ret;
        vm.totalItems = vm.currentUsers.length;
    };

    vm.getUserInFilter = function(filter) {
        vm.currentUsers = [];
        for (var key in vm.users) {
            var user = vm.users[key];
            if (eval(filter)) {
                vm.currentUsers.push(user);
            }
        }
    }

    vm.showUserInFilter = function(filter) {
        vm.getUserInFilter(filter);
        vm.totalItems = vm.currentUsers.length;
    };

    vm.showApplies = function(user) {
        $scope.data.selectedUser = user;
        $location.path('/applies/' + user._id);
    };

    vm.showOrders = function(user) {
        $scope.data.selectedUser = user;
        // $location.path('/orders/' + user._id);
        $window.open('/support/#/orders/' + user._id);
    };

    vm.open = function (mobile) {

        var modalInstance = $modal.open({
            templateUrl: '/views/smsModal.html',
            controller: 'ModalInstanceCtrl',
            //size: size,
            resolve: {}
        });

        modalInstance.result.then(function (content) {
            vm.sms_content = content;
            var data = {
                user_mobile: mobile,
                sms_content: vm.sms_content
            };
            $http.post('/support/api/send_sms', data)
                .then(function(response) {
                    if (response.data.success) {
                        gbNotifier.notify('短信已发送');
                    } else {
                        gbNotifier.error('短信发送失败:' + response.data.reason);
                    }
                });
        }, function () {
            //console.log('Modal dismissed at: ' + new Date());
        });
    };

    /*
    vm.updateBalance = function(user) {
        var modalInstance = $modal.open({
            templateUrl: 'userUpdateModal.html',
            controller: 'UserUpdateModalCtrl',
            //size: size,
            resolve: {}
        });

        modalInstance.result.then(function (result) {
            if (result && result.balance && angular.isNumber(result.balance)) {
                var value = user.finance.balance + result.balance;
                if (value < 0) {
                    gbNotifier.error('无效的数据，重新输入！');
                } else {
                    user.finance.balance += result.balance;
                    user.$save(function(u) {
                        gbNotifier.notify('更新成功');
                    }, function(err) {
                        gbNotifier.error('更新失败:' + err.toString());
                    });
                }
            } else {
                gbNotifier.error('无效的数据，重新输入！');
            }
        }, function () {
        });
    };
    */

    vm.createOrder = function(user) {
        var modalInstance = $modal.open({
            templateUrl: 'views/createOrderModel.html',
            controller: 'CreateOrderModalCtrl',
            //size: size,
            resolve: {
                user: function () {
                    return user;
                }
            }
        });

        modalInstance.result.then(function (result) {
            if (!result.order_amount || result.order_amount < 0) {
                gbNotifier.error('请输入有效的订单金额！');
            } else {
                result.userMobile = user.mobile;
                result.userID = user._id;
                $http.post('/support/api/create/order', result)
                    .success(function(data, status) {
                        gbNotifier.notify('订单创建成功！');
                    })
                    .error(function(data, status) {
                        gbNotifier.notify('订单创建失败:' + data.error_msg);
                    });
            }
        }, function () {
        });
    };

    vm.takeCustomer = function(user) {
        $http.post('/support/api/take_customer', {userMobile:user.mobile})
            .success(function(data, status) {
                user.manager = data.manager;
                gbNotifier.notify('更新成功!');
            })
            .error(function(data, status) {
                gbNotifier.error('更新失败!');
            });
    };
}]);

angular.module('supportApp').controller('ModalInstanceCtrl', ['$scope', '$modalInstance', 'sms_macro', function ($scope, $modalInstance, sms_macro) {
    $scope.sms_content = '您好，我是您在牛金网的专属客服XX。QQ:xxxxxx 微信:xxxxxx 如果您有任何问题都可以24小时随时咨询。牛金网感谢您对我们的支持，祝您股市大赚!';
    $scope.show_template = true;

    $scope.macroChange = function() {
        console.log($scope.content_macro);
        switch ($scope.content_macro) {
            case '0':
                $scope.sms_content = sms_macro[0].content;
                return;
            case '1':
                $scope.sms_content = sms_macro[1].content;
                return;
            case '2':
                $scope.sms_content = sms_macro[2].content;
                return;
            case '3':
                $scope.sms_content = sms_macro[3].content;
                return;
            case '4':
                $scope.sms_content = sms_macro[4].content;
                return;
            case '5':
                $scope.sms_content = sms_macro[5].content;
                return;
            case '6':
                $scope.sms_content = sms_macro[6].content;
                return;
            case '7':
                $scope.sms_content = sms_macro[7].content;
                return;
        }
    };

    $scope.ok = function () {
        $modalInstance.close($scope.sms_content);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('supportApp').controller('UserUpdateModalCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.ok = function () {
        $modalInstance.close($scope.user);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('supportApp').controller('CreateOrderModalCtrl', ['$scope', '$modalInstance', 'user', function ($scope, $modalInstance, user) {
    $scope.userMobile = user.mobile;
    $scope.data = {};
    $scope.data.order_type = 1;

    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
