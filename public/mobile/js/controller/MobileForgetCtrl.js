'use strict';
angular.module('mobileApp').controller('MobileForgetCtrl', ['$location', '$timeout', '$interval', '$http', function($location, $timeout, $interval, $http) {
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
        if (!vm.img_code) {
            vm.signupError = true;
            vm.errorMsg = '请输入图形验证码';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }

        var type = reset ? 2 : 1;
        $http.get('/api/send_sms_verify_code?mobile=' + vm.mobile + '&type=' + type + '&code=' + vm.img_code)
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
                vm.signupError = true;
                $timeout(function() {
                    vm.signupError = false;
                }, 2000);
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
        if (!vm.img_code) {
            vm.signupError = true;
            vm.errorMsg = '请输入图形验证码';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        if (!vm.verify_code) {
            vm.errorMsg = '请输入短信验证码';
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
                $timeout(function() {
                   $location.path('/');
                }, 2000);
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

    vm.imgClicked = function(e) {
        var x = Math.random();
        e.target.src = '/api/get_verify_img?cacheBuster=' + x;
    };

}]);