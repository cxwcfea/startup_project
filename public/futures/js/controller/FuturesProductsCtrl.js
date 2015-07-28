'use strict';
angular.module('futuresApp').controller('FuturesProductsCtrl', ['$scope', '$window', '$modal', '$location', 'util', function($scope, $window, $modal, $location, util) {
    $scope.data.selectedItem = 0;

    var startTime = moment();
    startTime.hour(9);
    startTime.minute(15);
    startTime.second(0);

    var endTime = moment();
    endTime.hour(15);
    endTime.minute(10);
    endTime.second(0);

    var now = moment();

    var midTime1 = moment();
    midTime1.hour(11);
    midTime1.minute(30);
    midTime1.second(1);

    var midTime2 = moment();
    midTime2.hour(13);
    midTime2.minute(0);
    midTime2.second(0);

    var tradeTime = true;
    if (util.isHoliday(now.dayOfYear())) {
        tradeTime = false;
    } else if (now < startTime || now > endTime) {
        tradeTime = false;
    } else if (now > midTime1 && now < midTime2) {
        tradeTime = false;
    }

    //var tradeTime = true;

    $scope.products = [
        {
            value: 0,
            name: 'IF1508',
            type: '股 指',
            intro: '沪深300指数，涨跌均可买',
            status: tradeTime ? 1 : 0,
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
        }
        $location.path('/home');
    };
}]);