(function () {
    'use strict';
    angular.module('registerApp', []);
    angular.module('registerApp').controller('RegisterCtrl', ['$http', '$location', '$window', '$interval', function($http, $location, $window, $interval) {
        var vm = this;

        vm.show_verify_window = false;

        vm.register = function() {
            if (!vm.mobile) {
                alert('请输入正确的手机号');
                return;
            }
            if (!vm.password) {
                alert('请输入密码，长度6到20位');
                return;
            }
            if (!vm.confirm_password) {
                alert('请再输一遍密码，长度6到20位');
                return;
            }
            if (vm.password != vm.confirm_password) {
                alert('两次密码应该保持一致');
                return;
            }
            var data = {
                mobile: vm.mobile,
                password: vm.password,
                confirm_password: vm.confirm_password
            };
            $http.post('/pre_signup', data)
                .success(function(data, status, headers, config) {
                    vm.show_verify_window = true;
                    vm.getVerifyCode();
                })
                .error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        };

        vm.verifyCodeBtnText = '重发验证码';
        var verifyBtnDisabled = false;
        vm.getVerifyCode = function() {
            if (verifyBtnDisabled) {
                return;
            }
            verifyBtnDisabled = true;
            var count = 0;
            vm.verifyCodeBtnText = '60秒后重试';
            var timeId = $interval(function() {
                ++count;
                vm.verifyCodeBtnText = 60-count + '秒后重试';
                if (count === 60) {
                    $interval.cancel(timeId);
                    vm.verifyCodeBtnText = '重发验证码';
                    verifyBtnDisabled = false;
                }
            }, 1000);

            $http.get('/api/send_sms_verify_code?mobile=' + vm.mobile)
                .success(function(data, status, headers, config) {
                    console.log('ok');
                    //addAlert('success', '验证码已发送');
                })
                .error(function(data, status, headers, config) {
                    //addAlert('danger', '验证码发送失败，请稍后重试');
                });
        };

        vm.confirmVerifyCode = function() {
            if (!vm.verify_code) {
                alert('请输入验证码');
                return;
            }
            $http.post('/post_signup', {verify_code:vm.verify_code})
                .success(function(data, status, headers, config) {
                    console.log('ok');
                    $('#verify_code')[0].value = vm.verify_code;
                    $('#signup-form')[0].submit();
                })
                .error(function(data, status, headers, config) {
                    if (data.errorCode === 1) {
                        console.log('验证码错误');
                    }
                });
        };
    }]);
}());
