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
        $http.post('/futures/make_appointment', {mobile:mobile})
            .success(function(data, status) {
                displayError('预约成功');
            })
            .error(function(data, status) {
                displayError('预约失败');
            });
    };
}]);