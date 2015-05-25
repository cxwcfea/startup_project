'use strict';
angular.module('mobileApp').controller('MobileSignupCtrl', ['$scope', '$window', '$timeout', '$http', '$interval', function($scope, $window, $timeout, $http, $interval) {
    var vm = this;

    vm.signupError = false;
    vm.verifyCodeBtnText = '获取验证码';
    vm.verifyBtnDisabled = false;

    vm.signup = function() {
        if (!vm.mobile) {
            vm.signupError = true;
            vm.errorMsg = '请输入正确的手机号';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        if (!vm.password) {
            vm.signupError = true;
            vm.errorMsg = '请输入密码，长度6到20位';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        if (!vm.confirm_password) {
            vm.signupError = true;
            vm.errorMsg = '请再输一遍密码，长度6到20位';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        if (vm.password != vm.confirm_password) {
            vm.signupError = true;
            vm.errorMsg = '两次密码应该保持一致';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        if (!vm.img_code) {
            vm.signupError = true;
            vm.errorMsg = '请输入6位验证码';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        var data = {
            mobile: vm.mobile,
            password: vm.password,
            img_code: vm.img_code,
            confirm_password: vm.confirm_password
        };
        var mgm_code = $('#mgm-code')[0].value;
        if (mgm_code) {
            data.mgm_code = 'm_' + mgm_code;
        }
        $http.post('/api/signup', data)
            .success(function(data, status, headers, config) {
                vm.show_verify_window = true;
                vm.getVerifyCode();
            })
            .error(function(data, status, headers, config) {
                vm.errorMsg = data.error_msg;
                vm.signupError = true;
                $timeout(function() {
                    vm.signupError = false;
                }, 2500);
                var x = Math.random();
                $('#img_code')[0].src = '/api/get_verify_img?cacheBuster=' + x;
            });
    };

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
        $http.get('/api/send_sms_verify_code?mobile=' + vm.mobile + '&type=' + type + '&code=' + vm.img_code)
            .success(function(data, status, headers, config) {
                //addAlert('success', '验证码已发送');
            })
            .error(function(data, status, headers, config) {
                vm.show_verify_window = false;
                vm.verifyBtnDisabled = false;
                vm.errorMsg = data.error_msg;
                vm.signupError = true;
                $timeout(function() {
                    vm.signupError = false;
                }, 1500);
            });
    };

    vm.confirmVerifyCode = function() {
        if (!vm.verify_code) {
            vm.errorMsg = '请输入验证码';
            vm.signupError = true;
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        if (vm.verify_code.length != 4) {
            vm.errorMsg = '验证码错误，请重新输入';
            vm.signupError = true;
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        $http.post('/finish_signup', {mobile:vm.mobile, verify_code:vm.verify_code})
            .success(function(data, status, headers, config) {
                $window.location.replace('/mobile/welcome.html');
            })
            .error(function(data, status, headers, config) {
                vm.errorMsg = data.error_msg;
                vm.signupError = true;
                $timeout(function() {
                    vm.signupError = false;
                }, 1500);
            });
    };

    vm.imgClicked = function(e) {
        var x = Math.random();
        e.target.src = '/api/get_verify_img?cacheBuster=' + x;
    };
}]);