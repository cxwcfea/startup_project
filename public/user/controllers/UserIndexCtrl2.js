'use strict';
angular.module('userApp2').controller('UserIndexCtrl2', ['$scope', '$window', function($scope, $window) {
    var vm = this;

    $scope.data = {
        menu: 1
    };

    $scope.data.currentUser = $window.bootstrappedUserObject;
}]);