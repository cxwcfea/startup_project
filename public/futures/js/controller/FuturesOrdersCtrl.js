'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', '$filter', function($scope, $window, $http, $filter) {
    $scope.user = $scope.data.currentUser;
    $scope.data.selectedItem = 3;
    $scope.originCapital = 1000000;

    $http.get('/api/futures/get_orders')
        .success(function(data, status) {
            $scope.orders = data.orders;
            $scope.userInfo = data.user;
        })
        .error(function(data, status) {

        });
	
	$window.njPersonChart(1000000.00,1234000.00,0.00);
	
}]);