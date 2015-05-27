'use strict';
angular.module('mobileApp').controller('MobileWeixinBandCtrl', ['$scope', '$window', '$timeout', '$http', '$interval', function($scope, $window, $timeout, $http, $interval) {
    var vm = this;

    vm.inputError = false;

    vm.band = function() {
        if (!vm.mobile) {
            vm.inputError = true;
            vm.errorMsg = '请输入正确的手机号';
            $timeout(function() {
                vm.signupError = false;
            }, 1500);
            return;
        }
        $http.post('/api/weixin_band_user', {mobile:vm.mobile})
            .success(function(data, status, headers, config) {
                vm.bandSuccess = true;
            })
            .error(function(data, status, headers, config) {
                vm.errorMsg = data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 2500);
            });
    };

}]);