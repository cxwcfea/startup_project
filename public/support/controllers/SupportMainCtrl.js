'use strict';
angular.module('supportApp').controller('SupportMainCtrl', ['$scope', '$location', '$http', function($scope, $location, $http) {
    var vm = this;

    $scope.data = {
    };

    vm.gotoRoot = function() {
        window.location = '/';
    };

    vm.signout = function() {
        $http.post('/logout', {logout:true})
            .then(function() {
                window.location = '/';
            });
    };
}]);
