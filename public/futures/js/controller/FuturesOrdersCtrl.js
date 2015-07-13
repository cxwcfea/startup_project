'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', function($scope, $window, $http) {
    $scope.user = $scope.data.currentUser;

    $http.get('/api/futures/get_orders')
        .success(function(data, status) {
            alert(data);
        })
        .error(function(data, status) {

        });
}]);