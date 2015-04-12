'use strict';
angular.module('supportApp').controller('SupportUserListCtrl', ['$scope', '$http', '$modal', '$location', 'gbUser', 'gbNotifier', '$filter', '$window', function($scope, $http, $modal, $location, gbUser, gbNotifier, $filter, $window) {
    var vm = this;
    vm.users = gbUser.query(function() {
        vm.users = $filter('orderBy')(vm.users, 'registerAt', true);
        vm.showAllUsers();
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

    vm.showAllUsers = function() {
        vm.totalItems = vm.users.length;
        vm.currentPage = 1;
        vm.itemsPerPage = 15;
        vm.pageChanged();
    };

    vm.searchUser = function() {
        if (!vm.searchKey) {
            return;
        }
        vm.currentUsers = [];
        for (var key in vm.users) {
            if (vm.users[key].mobile == vm.searchKey) {
                vm.currentUsers.push(vm.users[key]);
                break;
            }
        }
        vm.totalItems = vm.currentUsers.length;
    };

    vm.showUsersNotComplete = function() {
        vm.currentUsers = vm.users.filter(function (elem) {
            return !elem.registered;
        });
        vm.totalItems = vm.currentUsers.length;
        vm.currentPage = 1;
        vm.pageChanged();
        return;
    };

    vm.showApplies = function(user) {
        $scope.data.selectedUser = user;
        //$location.path('/applies/' + user._id);
        $window.open('/support/#/applies/' + user._id);
    };

    vm.showOrders = function(user) {
        $scope.data.selectedUser = user;
        //$location.path('/orders/' + user._id);
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
            $http.post('/admin/api/send_sms', data)
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
                $http.post('/admin/api/create/order', result)
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
        $http.post('/admin/api/take_customer', {userMobile:user.mobile})
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
