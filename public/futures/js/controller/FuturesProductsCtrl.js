'use strict';
angular.module('futuresApp').controller('FuturesProductsCtrl', ['$scope', '$window', '$modal', '$location', function($scope, $window, $modal, $location) {
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
    if (now < startTime || now > endTime) {
        tradeTime = false;
    } else if (now > midTime1 && now < midTime2) {
        tradeTime = false;
    }

    $scope.products = [
        {
            value: 0,
            name: 'IF1509',
            type: '股 指',
            intro: '沪深300指数，涨跌均可买',
            status: tradeTime ? 1 : 0,
            alias: '股指',
            time: '工作日09:15-11:30  13:00-15:15'
        },
        {
            value: 4,
            name: 'AG1512',
            type: '沪 银',
            intro: '白银期货',
            status: 0,
            alias: '白银',
            time: '工作日09:00-10:05 10:30-11:20 13:30-14:50 21:00-02:20'
        }
        /*
        {
            value: 1,
            name: 'EURUSD',
            type: '欧 元',
            intro: '暂无相关介绍（开发中）',
            status: 0,
            alias: '欧元',
            time: '工作日05:15-次日05:00'
        },
        {
            value: 2,
            name: 'XAUUSD',
            type: '黄 金',
            intro: '暂无相关介绍（开发中）',
            status: 0,
            alias: '黄金',
            time: '工作日06:00-次日05:00'
        },
        {
            value: 3,
            name: 'BABA',
            type: '美 股',
            intro: '中概股，晚上交易，涨跌均可买（开发中）',
            status: 0,
            alias: 'BABA',
            time: '工作日09:15-11:30  13:00-15:15'
        }
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
        if (index) {
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