'use strict';
angular.module('adminApp').controller('AdminUserComplainListCtrl', ['$scope', '$location', '$modal', '$http', 'adminOrder', 'gbNotifier', function($scope, $location, $modal, $http, adminOrder, gbNotifier) {
    var vm = this;
    var complain_list = {};
    var currentComplains;
    vm.itemsPerPage = 15;

    initData();

    function initData() {
        $http.get('/admin/api/user_complain_list')
            .success(function(data, status) {
                console.log(data);
                complain_list = data;
                currentComplains = complain_list;
                pageReset();
            })
            .error(function(data, status) {
                gbNotifier.error('获取信息失败');
            });
    }

    function pageReset() {
        vm.totalItems = currentComplains.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentComplains.slice(start, end);
    };

    vm.searchUser = function(mobile) {
        $scope.data.searchKey = mobile;
        $location.path('/user_page');
    };
}]);
