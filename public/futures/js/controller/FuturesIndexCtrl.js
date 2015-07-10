'use strict';
angular.module('futuresApp').controller('FuturesIndexCtrl', ['$scope', '$window', function($scope, $window) {
    $scope.data = {};
    $scope.data.currentUser = $window.bootstrappedUserObject;
}]);