'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', function($scope, $window, $http) {
    $scope.user = $scope.data.currentUser;
    $scope.originCapital = 1000000;

    $http.get('/api/futures/get_orders')
        .success(function(data, status) {
            $scope.orders = $filter('orderBy')(data.orders, 'timestamp', true);
            $scope.userInfo = data.user;
        })
        .error(function(data, status) {

        });
}]);