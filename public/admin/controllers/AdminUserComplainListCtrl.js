'use strict';
angular.module('adminApp').controller('AdminUserComplainListCtrl', ['$scope', '$location', '$modal', '$http', '$filter', 'adminOrder', 'gbNotifier', function($scope, $location, $modal, $http, $filter, adminOrder, gbNotifier) {
    var vm = this;
    var complain_list = {};
    var currentComplains;
    vm.itemsPerPage = 15;

    initData();

    function initData() {
        $http.get('/admin/api/user_complain_list')
            .success(function(data, status) {
                complain_list = $filter('orderBy')(data, 'createdAt', true);
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

    vm.removeItem = function(item) {
        $http.post('/admin/api/delete_user_complain', {id:item._id})
            .success(function(data, status) {
                _.remove(complain_list, function(o) {
                    return o._id === item._id;
                });
                currentComplains = complain_list;
                pageReset();
                gbNotifier.notify('删除成功');
            })
            .error(function(data, status) {
                gbNotifier.notify('删除失败 ' + data.error_msg);
            });
    };
}]);
