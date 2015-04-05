'use strict';
angular.module('mobileApp').controller('MobileLoginCtrl', ['$scope', '$location', '$timeout', '$http', function($scope, $location, $timeout, $http) {
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
                $scope.data.currentUser = data.user;
                if ($scope.data.lastLocation) {
                    $location.path($scope.data.lastLocation);
                } else {
                    $location.path('/exp');
                }
            })
            .error(function(data, status, headers, config) {
                console.log('login error ' + data.error_msg);
            });
    }
}]);