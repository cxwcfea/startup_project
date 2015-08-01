'use strict';
angular.module('futuresApp').controller('FuturesWithdrawCtrl', ['$scope', '$window', function($scope, $window) {
    $scope.user = $scope.data.currentUser;
    $scope.withdraw = function() {
        alert($scope.user.wechat.wechat_openid);
		// $http.get('/api/futures/get_redEnvelop?openid=' + $scope.user.wechat.wechat_openid)
		$http.get('/api/futures/get_redEnvelop')
			.success(function(data, status) {
				var money = data.money;
				alert('您已获得红包，请到微信领取');
			})
			.error(function(data, status) {
				alert('网络错误');
			});
    };
}]);
