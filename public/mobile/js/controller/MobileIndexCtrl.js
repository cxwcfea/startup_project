'use strict';
angular.module('mobileApp').controller('MobileIndexCtrl', ['$scope', '$window', function($scope, $window) {
    var vm = this;
    $scope.data = {};
    $scope.data.currentUser = $window.bootstrappedUserObject;
}]);