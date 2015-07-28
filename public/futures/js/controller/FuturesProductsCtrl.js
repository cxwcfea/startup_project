'use strict';
angular.module('futuresApp').controller('FuturesProductsCtrl', ['$scope', '$window', '$modal', '$location', function($scope, $window, $modal, $location) {
    $scope.data.selectedItem = 0;

    $scope.products = [
        {
            value: 0,
            name: 'IF1508',
            type: '股 指',
            intro: '沪深300指数，涨跌均可买',
            status: 1,
            alias: '股指',
            time: '工作日09:15-11:30  13:00-15:15'
        },
        {
            value: 1,
            name: 'EURUSD',
            type: '欧 元',
            intro: '（开发中...）暂无相关介绍',
            status: 0,
            alias: '欧元',
            time: '工作日05:15-次日05:00'
        },
        {
            value: 2,
            name: 'XAUUSD',
            type: '黄 金',
            intro: '（开发中...）暂无相关介绍',
            status: 0,
            alias: '黄金',
            time: '工作日06:00-次日05:00'
        }
        /*
         {
         value: 1,
         name: 'BABA',
         type: '美 股',
         intro: '中概股，晚上交易，涨跌均可买',
         status: 0,
         time: '工作日09:15-11:30  13:00-15:15'
         },
         */
    ];
	
	$scope.openQrcodePopup = function (size) {
		var modalInstance = $modal.open({
			animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/qrcode_popup.html',
            controller: 'IntroModalCtrl',
            size: size,
            resolve: {}
		});
	};
	
	$scope.showQrcode = function() {
		$scope.openQrcodePopup('lg');
	};

    $scope.selectProduct = function (index) {
		if (index != 0) {
			return;
		}
        var oldIndex = $scope.data.selectedProduct;
        $scope.data.selectedProduct = index;
        if (oldIndex != index) {
            $scope.data.productID = index;
            $scope.data.productType = $scope.products[index].alias;
            if ($scope.data.socket) {
                $scope.data.socket.emit('join', {name:$scope.data.currentUser._id, room:index});
            }
            $location.path('/home');
        }
    };
}]);