'use strict';
angular.module('userApp').controller('UserHomeCtrl', ['$scope', '$location', '$http', function($scope, $location, $http) {
    var vm = this;

    console.log($scope.data.currentUser);
    vm.user = $scope.data.currentUser;

    vm.user_total_capital = vm.user.finance.balance + vm.user.finance.freeze_capital;
}]);