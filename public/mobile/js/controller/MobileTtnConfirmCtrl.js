'use strict';
angular.module('mobileApp').controller('MobileTtnConfirmCtrl', ['$scope', '$window', '$location', '$http', 'days', 'util', function($scope, $window, $location, $http, days, util) {
    var vm = this;
    vm.apply = {};
    if (!!$window.bootstrappedApplyObject) {
        angular.extend(vm.apply, $window.bootstrappedApplyObject);
    }

    vm.validDays = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

    function calculateAmount() {
        vm.serviceFee = vm.apply.amount / 10000 * util.getServiceCharge(vm.apply.lever) * vm.apply.period;
        vm.totalAmount = vm.apply.deposit + vm.serviceFee;
        vm.shouldPay = vm.totalAmount - vm.apply.userBalance;
        if (vm.shouldPay <= 0) {
            vm.shouldPay = 0;
            vm.balancePay = true;
        } else {
            vm.balancePay = false;
        }
    }

    calculateAmount();

    vm.selectDay = function() {
        calculateAmount();
    };

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
