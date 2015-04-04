'use strict';
angular.module('userApp2').controller('UserAccountCtrl2', ['$scope', '$filter', '$window', '$http', '$interval', '$location', '$timeout', 'BankNameList', 'njCard', function($scope, $filter, $window, $http, $interval, $location, $timeout, BankNameList, njCard) {
    var vm = this;

    var verifyCodeBtnText = "获取验证码";
    var verifyBtnDisabled = false;
    $scope.data.menu = 4;
    vm.user = $scope.data.currentUser;
    vm.sendingEmail = false;
    vm.verifyCodeBtnText = verifyCodeBtnText;
    vm.showVerifyEmailWindow = false;
    vm.showResetPasswordWindow = false;
    vm.passwordChangeSuccess = false;
    vm.emailChangeSuccess = false;
    var cards = njCard.query({uid:vm.user._id}, function() {
        vm.card = cards.pop();
    });
    vm.BankNameList = BankNameList;

    vm.alerts = [];

    var addAlert = function(type, msg) {
        vm.alerts = [];
        vm.alerts.push({type:type, msg: msg});
    };

    vm.closeAlert = function(index) {
        vm.alerts.splice(index, 1);
    };

    /*
    vm.verifyEmail = function() {
        if (vm.sendingEmail) return;
        vm.sendingEmail = true;
        $http.post('/user/verify_email', {email:vm.user.profile.email})
            .then(function(response) {
                vm.sendingEmail = false;
                if (response.data.success) {
                    vm.currentCategory = vm.categories[4];
                    resetUserInfoItem();
                } else {
                    addAlert('danger', '邮件发送失败,请稍后再试');
                }
            });
    };
    */

    vm.verifyEmailBySMSCode = function() {
        if (!vm.user_email) {
            addAlert('danger', '请输入有效的邮箱地址');
            return;
        }
        if (!vm.verify_code) {
            addAlert('danger', '请输入短信验证码');
            return;
        }
        if (vm.user.profile.email && vm.user.profile.email_verified && vm.user.profile.email == vm.user_email) {
            addAlert('danger', '该邮箱已经绑定');
            return;
        }
        $http.post('/user/verify_email_by_sms', {email:vm.user_email, verify_code:vm.verify_code})
            .success(function(data, status, headers, config) {
                vm.verify_code = '';
                vm.user.profile.email = vm.user_email;
                vm.user.profile.email_verified = true;
                vm.emailChangeSuccess = true;
            })
            .error(function(data, status, headers, config) {
                addAlert('danger', data.error_msg);
            });
    };

    vm.verifyUserIdentity = function() {
        if (!vm.identity_name || !vm.identity_id) {
            addAlert('danger', '请输入有效的姓名及身份证号');
            return;
        }
        if (vm.identity_name.length > 8) {
            addAlert('danger', '您输入的姓名太长，请重新输入');
            return;
        }
        vm.user.identity.name = vm.identity_name;
        vm.user.identity.id = vm.identity_id;
        $http.post('/api/user/' + vm.user._id, vm.user)
            .success(function(data, status) {
                vm.user = data;
                addAlert('success', '实名认证成功');
                resetUserInfoItem();
            })
            .error(function(data, status) {
                addAlert('danger', '实名认证出错,请稍后再试');
            });
    };

    vm.getVerifyCode = function() {
        console.log('getVerifyCode ' + verifyBtnDisabled);
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
                vm.verifyCodeBtnText = verifyCodeBtnText;
                verifyBtnDisabled = false;
            }
        }, 1000);

        $http.get('/api/send_sms_verify_code?mobile=' + vm.user.mobile)
            .success(function(data, status, headers, config) {
                addAlert('success', '验证码已发送');
            })
            .error(function(data, status, headers, config) {
                addAlert('danger', '验证码发送失败，请稍后重试');
            });
    };

    vm.setFinancePassword = function() {
        if (!vm.finance_pass || !vm.confirm_finance_pass || !vm.verify_code) {
            addAlert('danger', '请确保各项输入正确');
            return;
        }
        if (vm.finance_pass != vm.confirm_finance_pass) {
            addAlert('danger', '两次密码输入不一致');
            return;
        }
        $http.post('/user/change_finance_pass', {mobile:vm.user.mobile, new_password:vm.finance_pass, confirm_password:vm.confirm_finance_pass, verify_code:vm.verify_code})
            .success(function(data, status, headers, config) {
                addAlert('success', '提现密码设置成功');
                vm.user.finance.password = vm.finance_pass;
                vm.confirm_finance_pass = '';
                vm.verify_code = '';
                resetUserInfoItem();
                $timeout(function() {
                    vm.currentCategory = vm.categories[0];
                }, 2000);
            })
            .error(function(data, status, headers, config) {
                addAlert('danger', data.error_msg);
            });
    };

    vm.setupEmail = function() {
        if (!vm.user_email) {
            addAlert('danger', '请输入有效的邮箱地址');
            return;
        }
        if (vm.user.profile.email && vm.user.profile.email_verified && vm.user.profile.email == vm.user_email) {
            addAlert('danger', '该邮箱已经绑定');
            return;
        }
        vm.user.profile.email = vm.user_email;
        vm.user.profile.email_verified = false;
        $http.post('/api/user/' + vm.user._id, vm.user)
            .success(function(data, status) {
                $http.post('/user/verify_email', {email:vm.user.profile.email})
                    .success(function(data, status) {
                        console.log('email send success');
                    })
                    .error(function(data, status) {
                        console.log('email send faile');
                    });
                vm.currentCategory = vm.categories[4];
            })
            .error(function(data, status) {
                addAlert('danger', '设置邮箱时出错,请稍后再试');
            });
    };

    vm.changePassword = function() {
        if (!vm.password) {
            addAlert('danger', '请输入6到20位登录密码');
            return;
        }
        if (!vm.new_password) {
            addAlert('danger', '请输入6到20位新密码');
            return;
        }
        if (!vm.confirm_password) {
            addAlert('danger', '请再输入一遍新密码');
            return;
        }
        if (vm.password === vm.new_password) {
            addAlert('danger', '新密码不能与原密码相同');
            return;
        }
        if (vm.new_password !== vm.confirm_password) {
            addAlert('danger', '两次输入的新密码不同');
            return;
        }
        var data = {
            password: vm.password,
            new_password: vm.new_password,
            confirm_password: vm.confirm_password
        };
        $http.post('/user/reset_pass', data)
            .success(function(data, status) {
                vm.passwordChangeSuccess = true;
                console.log('success');
            })
            .error(function(data, status) {
                addAlert('danger', data.error_msg);
            });
    };
}]);