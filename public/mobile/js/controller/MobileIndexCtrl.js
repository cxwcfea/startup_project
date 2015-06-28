'use strict';
angular.module('mobileApp').controller('MobileIndexCtrl', ['$scope', '$window', '$location', function($scope, $window, $location) {
    var vm = this;
    $scope.data = {};
    $scope.data.currentUser = $window.bootstrappedUserObject;

    $scope.gotoApply = function() {
        $window.location.assign('/mobile/#/ttn');
    }
}]);