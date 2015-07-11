'use strict';
angular.module('mobileApp').controller('MobileYynConfirmCtrl', ['$scope', '$window', '$http', '$location', 'util', function($scope, $window, $http, $location, util) {
    var vm = this;
    vm.apply = {};
    if (!!$window.bootstrappedApplyObject) {
        angular.extend(vm.apply, $window.bootstrappedApplyObject);
    }

    vm.interest = util.getServiceFee(vm.apply);
    vm.totalAmount = vm.apply.deposit + vm.interest;
    vm.shouldPay = vm.totalAmount - vm.apply.userBalance;
    if (vm.shouldPay <= 0) {
        vm.shouldPay = 0;
        vm.balancePay = true;
    } else {
        vm.balancePay = false;
    }

    vm.payForApply = function() {
        vm.apply.shouldPay = vm.shouldPay;
        vm.apply.totalAmount = vm.totalAmount;
        $http.post('/apply_confirm', vm.apply)
            .success(function(data, status, headers, config) {
                if (vm.shouldPay === 0) {
                    var dataObj = {
                        apply_serial_id: data.apply.serialID,
                        order_id: data.order._id
                    };
                    $http.post('/api/users/pay_by_balance', dataObj)
                        .success(function(res) {
                            $window.location.assign('/mobile/apply/pay_success?serial_id=' + data.apply.serialID + '&amount=' + data.apply.amount);
                        })
                        .error(function(res, status) {
                            console.log('error:' + res.error_msg);
                        });
                } else {
                    $window.location.assign('/mobile/#/recharge_yeepay?order_id=' + data.order._id);
                }
            })
            .error(function(data, status, headers, config) {
                if (status === 403) {
                    if (data.error_code === 2) {
                        alert('对不起，同一用户最多只能有5笔操盘中的配资。暂不能再申请新的配资。');
                    } else if (data.error_code === 1) {
                        vm.showIdentityDialog = true;
                    }
                }
                console.log('error:' + data.reason);
            });
    };

    vm.redirectToIdentity = function() {
        $location.path('/account');
    };
}]);