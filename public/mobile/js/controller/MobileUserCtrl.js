'use strict';
angular.module('mobileApp').controller('MobileUserCtrl', ['$scope', '$window', '$location', '$http', function($scope, $window, $location, $http) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {};
        }
        $scope.data.lastLocation = '/user';
        $location.path('/login');
    }

    vm.menu = 4;
    vm.showInvest = false;

    vm.logout = function() {
        $http.post('/logout', {})
            .success(function(data, status) {
                $scope.data.currentUser = null;
                $window.bootstrappedUserObject = null;
                $location.path('/');
            })
            .error(function(data, status) {

            });
    };

    vm.viewFile = function () {
        return vm.showInvest ? "/mobile/user_invest.html" : "/mobile/user.html";
    };

}]);