'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', function($scope, $window) {
    $scope.user = $scope.data.currentUser;
}]);