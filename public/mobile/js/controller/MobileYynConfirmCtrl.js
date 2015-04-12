'use strict';
angular.module('mobileApp').controller('MobileYynConfirmCtrl', ['$scope', '$window', '$http', function($scope, $window, $http) {
    var vm = this;
    vm.apply = {};
    if (!!$window.bootstrappedApplyObject) {
        angular.extend(vm.apply, $window.bootstrappedApplyObject);
    }

    vm.interest = (vm.apply.amount - vm.apply.deposit) * vm.apply.interestRate;
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
                    $window.location.assign('/mobile/#/recharge_alipay?order_id=' + data.order._id);
                }
            })
            .error(function(data, status, headers, config) {
                console.log('error:' + data.reason);
            });
    };
}]);