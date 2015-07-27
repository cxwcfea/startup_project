'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', '$filter', function($scope, $window, $http, $filter) {
    $scope.user = $scope.data.currentUser;
    $scope.data.selectedItem = 3;
    $scope.originCapital = 1000000;
    var pageCount = 1;
    $scope.orders = [];

    function getOrderForPage(pageNum) {
        $http.get('/api/futures/get_orders?page=' + pageNum)
            .success(function(data, status) {
                $scope.orders = $scope.orders.concat(data.orders);
                alert($scope.orders.length);
                $scope.userInfo = data.user;
                if (pageNum === 1) {
                    $window.njPersonChart($scope.originCapital, ($scope.userInfo.cash/100));
                }
                pageCount = data.pageCount;
            })
            .error(function(data, status) {
                alert('load order error');
            });
    }

    getOrderForPage(1);

}]);