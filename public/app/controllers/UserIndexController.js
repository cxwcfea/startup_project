angular.module('myApp').controller('UserIndexController', ['$scope', '$location', '$http', function($scope, $location, $http) {
    $scope.gotoRoot = function() {
        window.location = '/';
    };

    $scope.signout = function() {
        console.log('run index ctrl');
        $http.post('/logout', {logout:true})
            .then(function() {
                window.location = '/';
            });
    };
}]);
