'use strict';
angular.module('futuresApp').controller('FuturesWithdrawCtrl', ['$scope', '$window', function($scope, $window) {
    $scope.user = $scope.data.currentUser;
    $scope.withdraw = function() {
        alert($scope.user.wechat.wechat_openid);
    };
}]);