'use strict';
angular.module('adminApp').controller('AdminContractListCtrl', ['$scope', '$http', '$location', '$modal', '$resource', 'gbNotifier', function($scope, $http, $location, $modal, $resource, gbNotifier) {
    var contract_list = {};
    var currentContract;
    $scope.itemsPerPage = 15;

    function pageReset() {
        $scope.totalItems = currentContract.length;
        $scope.currentPage = 1;
        $scope.pageChanged();
    }

    initData();

    function initData() {
        var ContractResource = $resource('/admin/api/contract_list', {});
        contract_list = ContractResource.query({}, function () {
            currentContract = contract_list;
            pageReset();
        });

        $scope.queryItems = [
            {
                name: '全部',
                value: 0
            },
            {
                name: '进行中',
                value: 1
            },
            {
                name: '已回款',
                value: 2
            }
        ];
    }

    $scope.pageChanged = function() {
        var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        var end = start + $scope.itemsPerPage;
        if (end > $scope.totalItems) {
            end = $scope.totalItems;
        }
        $scope.showingItems = currentContract.slice(start, end);
    };

    $scope.queryItem = function(item) {
        currentContract = contract_list.filter(function (elem) {
            if (!item.value) return true;
            return elem.status === item.value;
        });
        pageReset();
    };

    $scope.showBorrowerDetail = function(mobile) {
        $scope.data.searchKey = mobile;
        $location.path('user_page');
    };

    $scope.showInvestors = function(contract) {
        $scope.displayInvestors = true;
        $scope.investorsForCurrentContract = contract.investors;
    };
}]);
