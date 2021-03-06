'use strict';
angular.module('userApp').controller('UserIndexCtrl', ['$scope', '$window', function($scope, $window) {
    var vm = this;

    $scope.data = {
        menu: 1
    };

    $scope.data.currentUser = $window.bootstrappedUserObject;

    vm.capitalSubMenu = false;

    vm.showSubMenu = function(e, index) {
        if (index === 1) {
            vm.capitalSubMenu = true;
        }
    };

    vm.hideSubMenu = function(e, index) {
        if (index === 1) {
            vm.capitalSubMenu = false;
        }
    };
}]);