'use strict';
angular.module('adminApp').controller('AdminUserCtrl', ['$scope', '$http', '$modal', '$location', 'gbUser', 'gbNotifier', '$filter', function($scope, $http, $modal, $location, gbUser, gbNotifier, $filter) {
    var vm = this;
    if ($scope.data.searchKey) {
        vm.searchKey = $scope.data.searchKey;
    }


    vm.registerDate = function(date) {
        return moment(date).format("YYYY-MM-DD HH:mm");
    };

    vm.searchUser = function() {
        if (!vm.searchKey) {
            return;
        }
        $scope.data.searchKey = vm.searchKey;
        $http.get('/admin/api/user?mobile=' + vm.searchKey)
            .success(function(data, status) {
                vm.user = data;
            })
            .error(function(data, status) {
                gbNotifier.error('失败:' + data.error_msg);
            });
    };

    vm.showApplies = function() {
        $scope.data.selectedUser = vm.user;
        $location.path('/applies/' + vm.user._id);
    };

    vm.showOrders = function() {
        $scope.data.selectedUser = vm.user;
        $location.path('/orders/' + vm.user._id);
    };

    vm.open = function () {
        var modalInstance = $modal.open({
            templateUrl: '/views/smsModal.html',
            controller: 'ModalInstanceCtrl',
            //size: size,
            resolve: {}
        });

        modalInstance.result.then(function (content) {
            vm.sms_content = content;
            var data = {
                user_mobile: vm.user.mobile,
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
                    return vm.user;
                }
            }
        });

        modalInstance.result.then(function (result) {
            if (!result.order_amount || result.order_amount < 0) {
                gbNotifier.error('请输入有效的订单金额！');
            } else {
                result.userMobile = vm.user.mobile;
                result.userID = vm.user._id;
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
        $http.post('/admin/api/take_customer', {userMobile:vm.user.mobile})
            .success(function(data, status) {
                user.manager = data.manager;
                gbNotifier.notify('更新成功!');
            })
            .error(function(data, status) {
                gbNotifier.error('更新失败! ' + data.error_msg);
            });
    };
}]);
