'use strict';
angular.module('userApp').controller('UserIndexCtrl', ['$scope', '$window', 'njUser', function($scope, $window, njUser) {
    var vm = this;

    $scope.data = {
        menu: 1
    };

    njUser.get({id:$window.bootstrappedNiujinUserID}, function(user) {
        $scope.data.currentUser = user;
    });
}]);