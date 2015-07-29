'use strict';
angular.module('futuresApp').controller('FuturesUserCtrl', ['$scope', '$window', '$http', function($scope, $window, $http) {
    $scope.user = $scope.data.currentUser;
    $scope.originCapital = 1000000;

    $http.get('/api/futures/user_info')
        .success(function(data, status) {
            $window.njPersonChart($scope.originCapital, (data.lastCash/100));
            var delta = data.lastCash/100 - $scope.originCapital;
            $scope.profit = delta > 0 ? delta : 0;
            $scope.loss = delta < 0 ? delta : 0;
        })
        .error(function(data, status) {
            alert('load user info error');
        });
}]);