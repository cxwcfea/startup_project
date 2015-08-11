'use strict';
angular.module('futuresApp').controller('FuturesUserInfoCtrl', ['$scope', '$window', '$http', '$timeout', function($scope, $window, $http, $timeout) {
    $scope.user = $scope.data.currentUser;

    $scope.verifyUserIdentity = function() {
        if (!$scope.userName || !$scope.userID) {
            $scope.errorMsg = '请输入有效的姓名及身份证号';
            $scope.inputError = true;
            $timeout(function() {
                $scope.inputError = false;
            }, 1500);
            return;
        }
        $http.post('/user/set_identity', {userName:$scope.userName, userID:$scope.userID})
            .success(function(data, status) {
                $scope.user.identity.name = $scope.userName;
                $scope.user.identity.id = $scope.userID;
                $scope.success = true;
            })
            .error(function(data, status) {
                $scope.errorMsg = data.error_msg;
                $scope.inputError = true;
                $timeout(function() {
                    $scope.inputError = false;
                }, 1500);
            });
    };
}]);