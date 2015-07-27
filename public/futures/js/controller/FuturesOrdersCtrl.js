'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', '$filter', function($scope, $window, $http, $filter) {
    $scope.user = $scope.data.currentUser;
    $scope.data.selectedItem = 3;
    $scope.originCapital = 1000000;

    function getOrderForPage(pageNum) {
        $http.get('/api/futures/get_orders?page=' + pageNum)
            .success(function(data, status) {
                $scope.orders = data.orders;
                $scope.userInfo = data.user;
                $window.njPersonChart($scope.originCapital, ($scope.userInfo.cash/100));
            })
            .error(function(data, status) {
                alert('error');
            });
    }

    getOrderForPage(1);

}]);