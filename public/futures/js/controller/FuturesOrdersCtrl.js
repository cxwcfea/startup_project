'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', '$filter', function($scope, $window, $http, $filter) {
    $scope.user = $scope.data.currentUser;
    $scope.data.selectedItem = 3;
    $scope.originCapital = 1000000;
    var pageCount = 1;
    var currentPage = 1;
    $scope.orders = [];
    var loading = false;

    function getOrderForPage(pageNum) {
        loading = true;
        $http.get('/api/futures/get_orders?page=' + pageNum)
            .success(function(data, status) {
                ++currentPage;
                loading = false;
                $scope.orders = $scope.orders.concat(data.orders);
                $scope.userInfo = data.user;
                if (pageNum === 1) {
                    $window.njPersonChart($scope.originCapital, ($scope.userInfo.lastCash/100));
                }
                pageCount = data.pageCount;
            })
            .error(function(data, status) {
                alert('load order error');
            });
    }

    getOrderForPage(currentPage);

    $scope.loadMore = function() {
        if (loading) {
            return;
        }
        if (currentPage >= pageCount) {
            return;
        }
        getOrderForPage(currentPage);
    };

}]);