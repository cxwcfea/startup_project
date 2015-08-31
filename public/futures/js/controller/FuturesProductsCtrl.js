'use strict';
angular.module('futuresApp').controller('FuturesProductsCtrl', ['$scope', '$window', '$modal', '$location', 'Socket', function($scope, $window, $modal, $location, Socket) {
    $scope.data.selectedItem = 0;

    var now = moment();

    var startTime1 = moment().startOf('day');

    var endTime1 = moment();
    endTime1.hour(2);
    endTime1.minute(57);
    endTime1.second(0);

    var startTime2 = moment();
    startTime2.hour(9);
    startTime2.minute(0);
    startTime2.second(0);

    var endTime2 = moment();
    endTime2.hour(11);
    endTime2.minute(29);
    endTime2.second(59);

    var startTime3 = moment();
    startTime3.hour(13);
    startTime3.minute(30);
    startTime3.second(0);

    var endTime3 = moment();
    endTime3.hour(14);
    endTime3.minute(57);
    endTime3.second(0);

    var startTime4 = moment();
    startTime4.hour(21);
    startTime4.minute(0);
    startTime4.second(0);

    var tradeTime = true;
    if (now > endTime1 && now < startTime2) {
        tradeTime = false;
    } else if (now > endTime2 && now < startTime3) {
        tradeTime = false;
    } else if (now > endTime3 && now < startTime4) {
        tradeTime = false;
    }

    $scope.products = [
        {
            value: 0,
            name: 'A50',
            type: '指 数',
            intro: '开发中',
            status: 0,
            alias: 'A50',
            time: '工作日'
        },
        {
            value: 1,
            name: 'AG1512',
            type: '沪 银',
            intro: '白银期货',
            status: tradeTime ? 1 : 0,
            alias: 'AG1512',
            time: '工作日09:00-11:30 13:30-15:00 21:00-02:30'
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
        if (index != 1) {
            return;
        }
        var oldIndex = $scope.data.selectedProduct;
        $scope.data.selectedProduct = index;
        if (oldIndex != index) {
            $scope.data.productID = index;
            $scope.data.productType = $scope.products[index].alias;
            Socket.emit('join', {name:$scope.data.currentUser._id, room:index});
            $scope.data.flags_data = [];
        }
        $location.path('/home');
    };
}]);