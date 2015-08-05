'use strict';
angular.module('futuresApp').controller('FuturesAppointmentCtrl', ['$scope', '$window', '$http', '$timeout', function($scope, $window, $http, $timeout) {
    $scope.user = $scope.data.currentUser;

    function displayError(msg) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
        }, 2000);
    }

    $scope.appoint = function() {
        if (!$scope.mobile) {
            displayError('请输入有效手机号');
            return;
        }
        /*
        $http.get('/api/futures/deposit')
            .success(function(data, status) {
                // var money = data.money;
                alert('您已成功充值');
            })
            .error(function(data, status) {
                alert('网络错误');
            });
            */
    };
}]);