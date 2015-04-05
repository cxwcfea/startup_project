'use strict';
angular.module('mobileApp').controller('MobileForgetCtrl', ['$window', '$timeout', '$interval', '$http', function($window, $timeout, $interval, $http) {
    var vm = this;

    vm.showPass = false;
    vm.nextStep = false;
    vm.signupError = false;
    vm.verifyCodeBtnText = '获取验证码';
    vm.verifyBtnDisabled = false;
    vm.resetSuccess = false;
    vm.getVerifyCode = function(reset) {
        if (vm.verifyBtnDisabled) {
            return;
        }
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

        var type = reset ? 2 : 1;
        $http.get('/api/send_sms_verify_code?mobile=' + vm.mobile + '&type=' + type)
            .success(function(data, status, headers, config) {
                //addAlert('success', '验证码已发送');
            })
            .error(function(data, status, headers, config) {
                //addAlert('danger', '验证码发送失败，请稍后重试');
            });
    };

    vm.requestVerifyCode = function() {
        if (!vm.mobile) {
            vm.signupError = true;
            vm.errorMsg = '请输入正确的手机号';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        vm.getVerifyCode(true);
    };

    vm.requestChangePassNext = function() {
        if (!vm.mobile) {
            vm.signupError = true;
            vm.errorMsg = '请输入正确的手机号';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        if (!vm.verify_code) {
            vm.errorMsg = '请输入验证码';
            vm.signupError = true;
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        vm.nextStep = true;
    };

    vm.requestChangePass = function() {
        if (!vm.password) {
            vm.signupError = true;
            vm.errorMsg = '请输入密码，长度6到20位';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        vm.confirm_password = vm.password;
        $http.post('/forgot', {mobile:vm.mobile, verify_code:vm.verify_code, password:vm.password, confirm_password:vm.confirm_password})
            .success(function(data, status, headers, config) {
                vm.resetSuccess = true;
                vm.mobile = '';
                vm.verify_code = '';
                vm.password = '';
                vm.confirm_password = '';
            })
            .error(function(data, status, headers, config) {
                vm.signupError = true;
                vm.errorMsg = data.error_msg;
                $timeout(function() {
                    vm.signupError = false;
                }, 1500);
            });
    };

    vm.toggleShowPassword = function() {
        var $pwd = $('#J_forgetSetPassword');
        if (vm.showPass) {
            $pwd.attr('type', 'text');
        } else {
            $pwd.attr('type', 'password');
        }
    };

}]);