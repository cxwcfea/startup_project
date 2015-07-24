'use strict';
angular.module('futuresApp').controller('FuturesIndexCtrl', ['$scope', '$window', '$location', function($scope, $window, $location) {
    $scope.data = {};
    $scope.data.currentUser = $window.bootstrappedUserObject;
    
    /*$scope.data.currentUser = {
        score: 5,
        wechat: {
            wechat_img: 'http://wx.qlogo.cn/mmopen/uchmtWQh7iarnsx58BbzlB1GAOzjI3S8elKicd6t8CiahGE3JSDmkVnTNzicQA44DdRliaLOsI1wLI9o79kynDUIchg/0',
            wechat_name: '程翔',
            profit: 200,
            trader: {
                "timestamp" : 1437619086091,
                "lastCash" : 0,
                "status" : 0,
                "deposit" : 10000000,
                "cash" : 100000000,
                "debt" : 90000000,
                "lever" : 0,
                "close" : 90000000,
                "warning" : 0,
                "name" : "ogpOvt172ybaWRZBoxuiuEiB7wP0"
            }
        }
    };*/

    $scope.data.selectedItem = 1;
    $scope.items = [
        {
            value: 0,
            name: '自选',
            img: '/futures/images/foot1.png',
            selectedImg: '/futures/images/foot1-dark.png',
            page: '/products'
        },
        {
            value: 1,
            name: '交易',
            img: '/futures/images/foot2.png',
            selectedImg: '/futures/images/foot2-dark.png',
            page: '/home'
        },
        {
            value: 2,
            name: '股神榜',
            img: '/futures/images/foot3.png',
            selectedImg: '/futures/images/foot3-dark.png',
            page: '/user_rank'
        },
        {
            value: 3,
            name: '我的',
            img: '/futures/images/foot4.png',
            selectedImg: '/futures/images/foot4-dark.png',
            page: '/orders'
        }
    ];

    $scope.switchPage = function(item) {
        $location.path(item.page);
    };
    
	$scope.imgSrc1 = '/futures/images/foot1.png';
	$scope.imgSrc2 = '/futures/images/foot2-dark.png';
	$scope.imgSrc3 = '/futures/images/foot3.png';
	$scope.imgSrc4 = '/futures/images/foot4.png';
	$scope.rankSelected = false;
	$scope.productSelected = false;
	$scope.ordersSelected = false;
	$scope.homeSelected = true;
		
    $scope.showRank = function() {
        $location.path('/user_rank');
		$scope.imgSrc1 = '/futures/images/foot1.png';
		$scope.imgSrc2 = '/futures/images/foot2.png';
		$scope.imgSrc3 = '/futures/images/foot3-dark.png';
		$scope.imgSrc4 = '/futures/images/foot4.png';
		$scope.rankSelected = true;
		$scope.productSelected = false;
		$scope.ordersSelected = false;
		$scope.homeSelected = false;
    };

    $scope.showOrders = function() {
        $location.path('/orders');
		$scope.imgSrc1 = '/futures/images/foot1.png';
		$scope.imgSrc2 = '/futures/images/foot2.png';
		$scope.imgSrc3 = '/futures/images/foot3.png';
		$scope.imgSrc4 = '/futures/images/foot4-dark.png';
		$scope.rankSelected = false;
		$scope.productSelected = false;
		$scope.ordersSelected = true;
		$scope.homeSelected = false;
    };

    $scope.showHome = function() {
        $location.path('/home');
		$scope.imgSrc1 = '/futures/images/foot1.png';
		$scope.imgSrc2 = '/futures/images/foot2-dark.png';
		$scope.imgSrc3 = '/futures/images/foot3.png';
		$scope.imgSrc4 = '/futures/images/foot4.png';
		$scope.rankSelected = false;
		$scope.productSelected = false;
		$scope.ordersSelected = false;
		$scope.homeSelected = true;
    };

    $scope.showProducts = function() {
        $location.path('/products');
		$scope.imgSrc1 = '/futures/images/foot1-dark.png';
		$scope.imgSrc2 = '/futures/images/foot2.png';
		$scope.imgSrc3 = '/futures/images/foot3.png';
		$scope.imgSrc4 = '/futures/images/foot4.png';
		$scope.rankSelected = false;
		$scope.productSelected = true;
		$scope.ordersSelected = false;
		$scope.homeSelected = false;
    };
}]);