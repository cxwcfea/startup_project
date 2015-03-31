'use strict';
angular.module('userApp2').controller('UserHomeCtrl2', ['$scope', '$window', function($scope, $window) {
    var vm = this;

    vm.user = $scope.data.currentUser;
}]);
