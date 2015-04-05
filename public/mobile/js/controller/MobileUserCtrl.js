'use strict';
angular.module('mobileApp').controller('MobileUserCtrl', ['$scope', '$window', '$location', '$http', function($scope, $window, $location, $http) {
    var vm = this;

    vm.user = $scope.data.currentUser;
    if (!vm.user) {
        $scope.data.lastLocation = '/user';
        $location.path('/login');
    }

    vm.logout = function() {
        $http.post('/logout', {})
            .success(function(data, status) {
                $scope.data.currentUser = null;
                $location.path('/');
            })
            .error(function(data, status) {

            });
    };
}]);