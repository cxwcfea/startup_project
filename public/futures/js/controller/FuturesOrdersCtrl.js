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
	
	/*$scope.drawSector = function(x, y, radius, sAngle, eAngle) {
		alert("haha");
		var sector = angular.element("canvas");
		var ctx = sector.getContext('2d');
		ctx.beginPath();
		ctx.translate(x, y);
		ctx.moveTo(0, 0);
		ctx.arc(0, 0, radius, sAngle, eAngle);
		ctx.closePath();
		ctx.fill();
	};
	
	$scope.drawPecetageSector = function() {
		$scope.drawSector(100,100,50,0,MATH.PI*1.5);
		alert("hehe");
	}*/
	$window.njChart();
	
}]);