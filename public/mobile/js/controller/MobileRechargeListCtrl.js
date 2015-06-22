'use strict';
angular.module('mobileApp').controller('MobileRechargeListCtrl', ['$scope', '$window', '$location', function($scope, $window, $location) {
    $scope.user = $window.bootstrappedUserObject;
    $scope.showOtherChoice = false;
    if (!$scope.user) {
        if (!$scope.data) {
            $scope.data = {}
        }
        $scope.data.lastLocation = '/recharge';
        $location.path('/login');
    }

    $scope.otherChoice = function() {
        $scope.showOtherChoice = true;
    };
}]);