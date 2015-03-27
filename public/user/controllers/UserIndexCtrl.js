'use strict';
angular.module('userApp').controller('UserIndexCtrl', ['$scope', '$window', function($scope, $window) {
    var vm = this;

    $scope.data = {
        menu: 1
    };

    $scope.data.currentUser = $window.bootstrappedUserObject;
}]);