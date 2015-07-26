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
	$scope.$('#sectorChart').highcharts({
		alert("123");
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {
                text: 'Browser market shares at a specific website, 2014'
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true
                }
            },
            series: [{
                type: 'pie',
                name: 'Browser share',
                data: [
                    ['Firefox',   45.0],
                    ['IE',       26.8],
                    {
                        name: 'Chrome',
                        y: 12.8,
                        sliced: true,
                        selected: true
                    },
                    ['Safari',    8.5],
                    ['Opera',     6.2],
                    ['Others',   0.7]
                ]
            }]
        });
	
}]);