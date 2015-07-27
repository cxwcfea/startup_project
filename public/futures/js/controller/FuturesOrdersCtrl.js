'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', '$filter', function($scope, $window, $http, $filter) {
    $scope.user = $scope.data.currentUser;
    $scope.data.selectedItem = 3;
    $scope.originCapital = 1000000;

    $http.get('/api/futures/get_orders')
        .success(function(data, status) {
            $scope.orders = data.orders;
            $scope.userInfo = data.user;
            //alert(data.pageCount);
			//$window.njPersonChart($scope.originCapital.toFixed(2),($scope.userInfo.cash/100).toFixed(2));
			$window.njPersonChart($scope.originCapital, ($scope.userInfo.cash/100));
        })
        .error(function(data, status) {
            alert('error');
        });
	
	//$window.njPersonChart($scope.originCapital,$scope.userInfo.cash / 100);

}]);