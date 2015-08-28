'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', '$filter', '$location', function($scope, $window, $http, $filter, $location) {
    $scope.user = $scope.data.currentUser;
    $scope.data.selectedItem = 3;
    var pageCount = 1;
    var currentPage = 1;
    $scope.orders = [];
    var loading = false;

    $scope.currentItem = 0;
    $scope.items = [
        {
            name: '交易',
            value: 0
        },
        {
            name: '美元',
            value: 1
        },
        {
            name: '欧元',
            value: 2
        }
    ];

    function getOrderForPage(pageNum) {
        loading = true;
        $http.get('/api/futures/get_orders?page=' + pageNum + '&type=' + ($scope.data.real ? 1 : 0))
            .success(function(data, status) {
                ++currentPage;
                loading = false;
                $scope.orders = $scope.orders.concat(data.orders);
                $scope.userInfo = data.user;
                pageCount = data.pageCount;
            })
            .error(function(data, status) {
                //alert('load order error');
                $scope.orders = [];
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

    $scope.changeItem = function(item) {
        return;
        $scope.currentItem = item.value;
    };

}]);
