'use strict';
angular.module('userApp').controller('UserPromoteCtrl', ['$scope', '$window', function($scope, $window) {
    var vm = this;

    $scope.data.menu = 5;

    vm.user = $scope.data.currentUser;

}]);