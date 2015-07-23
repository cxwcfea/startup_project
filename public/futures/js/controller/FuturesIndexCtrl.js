'use strict';
angular.module('futuresApp').controller('FuturesIndexCtrl', ['$scope', '$window', '$location', function($scope, $window, $location) {
    $scope.data = {};
    //$scope.data.currentUser = $window.bootstrappedUserObject;
    
    $scope.data.currentUser = {
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
    };
    
	$scope.imgSrc1 = '/futures/images/foot1.png';
	$scope.imgSrc2 = '/futures/images/foot2-dark.png';
	$scope.imgSrc3 = '/futures/images/foot3.png';
	$scope.imgSrc4 = '/futures/images/foot4.png';

    $scope.showRank = function() {
        $location.path('/user_rank');
		imgSrc1 = '/futures/images/foot1.png';
		imgSrc2 = '/futures/images/foot2.png';
		imgSrc3 = '/futures/images/foot3-dark.png';
		imgSrc4 = '/futures/images/foot4.png';
    };

    $scope.showOrders = function() {
        $location.path('/orders');
		imgSrc1 = '/futures/images/foot1.png';
		imgSrc2 = '/futures/images/foot2.png';
		imgSrc3 = '/futures/images/foot3.png';
		imgSrc4 = '/futures/images/foot4-dark.png';
    };

    $scope.showHome = function() {
        $location.path('/home');
		imgSrc1 = '/futures/images/foot1.png';
		imgSrc2 = '/futures/images/foot2-dark.png';
		imgSrc3 = '/futures/images/foot3.png';
		imgSrc4 = '/futures/images/foot4.png';
    };

    $scope.showProducts = function() {
        $location.path('/products');
		imgSrc1 = '/futures/images/foot1-dark.png';
		imgSrc2 = '/futures/images/foot2.png';
		imgSrc3 = '/futures/images/foot3.png';
		imgSrc4 = '/futures/images/foot4.png';
    };
}]);