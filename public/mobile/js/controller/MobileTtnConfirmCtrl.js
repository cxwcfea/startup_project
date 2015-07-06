'use strict';
angular.module('mobileApp').controller('MobileTtnConfirmCtrl', ['$scope', '$window', '$location', '$http', 'days', 'util', function($scope, $window, $location, $http, days, util) {
    var vm = this;
    vm.apply = {};
    if (!!$window.bootstrappedApplyObject) {
        angular.extend(vm.apply, $window.bootstrappedApplyObject);
    }
    vm.freeDays = 0;
    vm.rebate = vm.freeDays * vm.apply.serviceCharge * vm.apply.amount / 10000;

    vm.validDays = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    vm.autoPostpone = true;

    function calculateAmount() {
        vm.serviceFee = util.getServiceFee(vm.apply);
        vm.totalAmount = vm.apply.deposit + vm.serviceFee - vm.rebate;
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
        vm.apply.autoPostpone = vm.autoPostpone;
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
                            $window.location.assign('/mobile/apply/pay_success?serial_id=' + data.apply.serialID + '&amount=' + data.apply.amount + '&type=' + 1);
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
                console.log('error:' + data.error_msg);
            });
    };

    vm.redirectToIdentity = function() {
        $location.path('/account');
    };
}]);
