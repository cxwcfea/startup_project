'use strict';
angular.module('mobileApp').controller('MobileAddCardCtrl', ['$scope', '$window', '$location', '$http', '$timeout', '$interval', 'BankNameList', 'njCard', function($scope, $window, $location, $http, $timeout, $interval, BankNameList, njCard) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {};
        }
        $scope.data.lastLocation = '/add_card';
        $location.path('/login');
    } else {
        vm.verifyCodeBtnText = '获取验证码';
        vm.bankList = BankNameList;
        vm.userBank = vm.bankList[0];
    }

    vm.getVerifyCode = function(reset) {
        if (vm.verifyBtnDisabled) {
            return;
        }
        if (!vm.img_code) {
            vm.inputError = true;
            vm.errorMsg = '请输入图形验证码';
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }

        $http.get('/api/send_sms_verify_code?mobile=' + vm.user.mobile + '&code=' + vm.img_code)
            .success(function(data, status, headers, config) {
                vm.verifyBtnDisabled = true;
                var count = 0;
                vm.verifyCodeBtnText = '60秒后重试';
                var timeId = $interval(function() {
                    ++count;
                    vm.verifyCodeBtnText = 60-count + '秒后重试';
                    if (count === 60) {
                        $interval.cancel(timeId);
                        vm.verifyCodeBtnText = '获取验证码';
                        vm.verifyBtnDisabled = false;
                    }
                }, 1000);
            })
            .error(function(data, status, headers, config) {
                var x = Math.random();
                $('#img_code')[0].src = '/api/get_verify_img?cacheBuster=' + x;
                vm.errorMsg = data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 2000);
            });
    };

    vm.imgClicked = function(e) {
        var x = Math.random();
        e.target.src = '/api/get_verify_img?cacheBuster=' + x;
    };

    vm.addWithdrawCard = function () {
        if (!vm.bankCardID) {
            vm.errorMsg = '请输入银行卡号';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 2000);
            return;
        }
        if (!vm.userName) {
            vm.errorMsg = '请输入持卡人姓名';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 2000);
            return;
        }
        if (!vm.verify_code) {
            vm.errorMsg = '请输入验证码';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 2000);
            return;
        }
        if (vm.verify_code.length != 4) {
            vm.errorMsg = '验证码错误，请重新输入';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 2000);
            return;
        }
        $http.post('/verify_mobile_code', {mobile:vm.user.mobile, verify_code:vm.verify_code})
            .success(function(data, status, headers, config) {
                var cardObj = {
                    userID: vm.user._id,
                    bankID: vm.userBank.value,
                    bankName: 'unknown',
                    cardID: vm.bankCardID,
                    userName: vm.userName
                };
                var newCard = new njCard(cardObj);
                newCard.$save(function(c, responseHeaders) {
                    vm.success = true;
                    $timeout(function() {
                        $location.path('/account');
                    }, 2000);
                }, function(response) {
                    vm.errorMsg = '添加失败 ' + response.data.error_msg;
                    vm.inputError = true;
                    $timeout(function() {
                        vm.inputError = false;
                    }, 2000);
                });
            })
            .error(function(data, status, headers, config) {
                vm.errorMsg = data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 2000);
            });
    };

}]);