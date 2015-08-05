'use strict';
angular.module('futuresApp').controller('FuturesAppointmentCtrl', ['$scope', '$window', '$http', function($scope, $window, $http) {
    $scope.user = $scope.data.currentUser;
    /*
    $scope.deposit = function() {
        $http.get('/api/futures/deposit')
            .success(function(data, status) {
                // var money = data.money;
                alert('您已成功充值');
            })
            .error(function(data, status) {
                alert('网络错误');
            });
    };
    */
}]);