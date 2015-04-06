'use strict';
angular.module('mobileApp').controller('MobileChangePassCtrl', ['$scope', '$window', '$location', '$timeout', '$interval', '$http', function($scope, $window, $location, $timeout, $interval, $http) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {};
        }
        $scope.data.lastLocation = '/change_pass';
        $location.path('/login');
    } else {
        vm.inputError = false;
        vm.resetSuccess = false;
    }

    vm.changePassword = function() {
        if (!vm.password) {
            vm.inputError = true;
            vm.errorMsg = '请输入登录密码，长度6到20位';
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.new_password) {
            vm.inputError = true;
            vm.errorMsg = '请输入新密码，长度6到20位';
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.confirm_password) {
            vm.inputError = true;
            vm.errorMsg = '请输入再输入一遍新密码';
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (vm.password === vm.new_password) {
            vm.inputError = true;
            vm.errorMsg = '新密码不能与原密码相同';
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (vm.new_password !== vm.confirm_password) {
            vm.inputError = true;
            vm.errorMsg = '两次输入的新密码不同';
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        var data = {
            password: vm.password,
            new_password: vm.new_password,
            confirm_password: vm.confirm_password
        };
        $http.post('/user/reset_pass', data)
            .success(function(data, status) {
                vm.resetSuccess = true;
                $timeout(function() {
                    vm.resetSuccess = false;
                    $location.path('/account');
                }, 2500);
                console.log('success');
            })
            .error(function(data, status) {
                vm.inputError = true;
                vm.errorMsg = data.error_msg;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
            });
    };

}]);