'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', '$filter', '$location', function($scope, $window, $http, $filter, $location) {
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
                    var delta = $scope.userInfo.lastCash == 0 ? 0 : $scope.userInfo.lastCash/100 - $scope.originCapital;
                    $scope.profit = delta > 0 ? delta : 0;
                    $scope.loss = delta < 0 ? delta : 0;
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

    $scope.showWithdraw = function() {
        $location('/withdraw');
    };

}]);