'use strict';
angular.module('mobileApp').controller('MobileLoginCtrl', ['$scope', '$location', '$window', '$timeout', '$http', function($scope, $location, $window, $timeout, $http) {
    var vm = this;

    vm.loginError = false;

    vm.login = function() {
        if (!vm.mobile || !vm.password) {
            vm.loginError = true;
            $timeout(function() {
                vm.loginError = false;
            }, 1500);
            return;
        }
        $http.post('/api/login', {mobile:vm.mobile, password:vm.password})
            .success(function(data, status, headers, config) {
                if (!$scope.data) {
                    if (data.location)
                        $location.path(data.location);
                    else
                        $location.path('/user');
                }
                $window.bootstrappedUserObject = data.user;
                if ($scope.data.lastLocation) {
                    $location.path($scope.data.lastLocation);
                } else {
                    $location.path('/');
                }
            })
            .error(function(data, status, headers, config) {
                console.log('login error ' + data.error_msg);
                vm.loginError = true;
                $timeout(function() {
                    vm.loginError = false;
                }, 1500);
            });
    }
}]);