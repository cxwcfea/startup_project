'use strict';
angular.module('futuresApp').controller('FuturesProductsCtrl', ['$scope', '$window', '$modal', function($scope, $window, $modal) {
    $scope.data.selectedItem = 0;

    $scope.selectedProduct = 0;
    $scope.products = [
        {
            value: 0,
            name: 'IF1508',
            type: '股 指',
            intro: '沪深300指数，涨跌均可买',
            status: 1,
            time: '工作日09:15-11:30  13:00-15:15'
        },
        {
            value: 1,
            name: 'EURUSD',
            type: '欧 元',
            intro: '暂无相关介绍',
            status: 0,
            time: '工作日00:00-23:59（全天）'
        },
        {
            value: 2,
            name: 'XAUUSD',
            type: '黄 金',
            intro: '暂无相关介绍',
            status: 0,
            time: '工作日00:00-23:59（全天）'
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
        var oldIndex = $scope.selectedProduct;
        $scope.selectedProduct = index;
        if (oldIndex != index) {
            $scope.data.productID = index;
            if ($scope.data.socket) {
                $scope.data.socket.emit('join', {name:$scope.data.currentUser._id, room:index});
            }
        }
    };
}]);