(function () {
    'use strict';
    angular.module('registerApp', ['ui.bootstrap', 'commonApp']);
    angular.module('registerApp').controller('RegisterCtrl', ['$http', '$location', '$window', '$interval', function($http, $location, $window, $interval) {
        var vm = this;

        vm.show_verify_window = false;
        vm.verify_code_error = false;
        //vm.show_forgot_step_2 = false;
        vm.agree = true;

        vm.register = function() {
            if (!vm.mobile) {
                addAlert('danger', '请输入正确的手机号');
                return;
            }
            if (!vm.password) {
                addAlert('danger', '请输入密码，长度6到20位');
                return;
            }
            if (!vm.confirm_password) {
                addAlert('danger', '请再输一遍密码，长度6到20位');
                return;
            }
            if (vm.password != vm.confirm_password) {
                addAlert('danger', '两次密码应该保持一致');
                return;
            }
            if (!vm.agree) {
                addAlert('danger', '您必须同意牛金网用户协议');
                return;
            }
            var data = {
                mobile: vm.mobile,
                password: vm.password,
                confirm_password: vm.confirm_password
            };
            $http.post('/api_signup', data)
                .success(function(data, status, headers, config) {
                    vm.show_verify_window = true;
                    vm.getVerifyCode();
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', data.error_msg);
                });
        };

        vm.verifyCodeBtnText = '获取验证码';
        vm.verifyBtnDisabled = false;
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

        vm.confirmVerifyCode = function() {
            if (!vm.verify_code) {
                addAlert('danger', '请输入验证码');
                return;
            }
            $http.post('/finish_signup', {mobile:vm.mobile, verify_code:vm.verify_code})
                .success(function(data, status, headers, config) {
                    $window.location.replace('/');
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', data.error_msg);
                });
        };

        vm.requestVerifyCode = function() {
            if (!vm.mobile) {
                addAlert('danger', '请输入正确的手机号');
                return;
            }
            vm.getVerifyCode(true);
        };

        vm.requestChangePassNext = function() {
        };

        vm.requestChangePass = function() {
            if (!vm.mobile) {
                addAlert('danger', '请输入正确的手机号');
                return;
            }
            if (!vm.verify_code) {
                addAlert('danger', '请输入验证码');
                return;
            }
            if (!vm.password) {
                addAlert('danger', '请输入密码，长度6到20位');
                return;
            }
            if (!vm.confirm_password) {
                addAlert('danger', '请再输一遍密码，长度6到20位');
                return;
            }
            if (vm.password !== vm.confirm_password) {
                addAlert('danger', '两次密码输入不一致');
                return;
            }
            $http.post('/forgot', {mobile:vm.mobile, verify_code:vm.verify_code, password:vm.password, confirm_password:vm.confirm_password})
                .success(function(data, status, headers, config) {
                    addAlert('success', '您的密码已经修改成功');
                    vm.mobile = '';
                    vm.verify_code = '';
                    vm.password = '';
                    vm.confirm_password = '';
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', data.error_msg);
                });
        };

        vm.login = function() {
            if (!vm.mobile) {
                addAlert('danger', '请输入正确的手机号');
                return;
            }
            if (!vm.password) {
                addAlert('danger', '请输入密码，长度6到20位');
                return;
            }
            $http.post('/api/login', {mobile:vm.mobile, password:vm.password})
                .success(function(data, status, headers, config) {
                    if (data.location) {
                        $window.location.replace(data.location);
                    } else {
                        $window.location.replace('/');
                    }
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', data.error_msg);
                });
        };

        vm.alerts = [];

        var addAlert = function(type, msg) {
            vm.alerts = [];
            vm.alerts.push({type:type, msg: msg});
        };

        vm.closeAlert = function(index) {
            vm.alerts.splice(index, 1);
        };

        if ($('#server_error_msg_login')[0]) {
            var error_code = $('#server_error_msg_login')[0].value;
            if (error_code == 1) {
                addAlert('danger', '手机号码错误');
            } else if (error_code == 2) {
                addAlert('danger', '请输入密码，长度6到20位');
            } else if (error_code == 3) {
                addAlert('danger', '该手机号码还未注册');
            }
        }
    }]);
}());
