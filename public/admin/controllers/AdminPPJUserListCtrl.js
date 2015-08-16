'use strict';
angular.module('adminApp').controller('AdminPPJUserListCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', function($scope, $location, $routeParams, $modal, $http, gbNotifier) {
    var users = {};
    $scope.currentUsers;
    $scope.itemsPerPage = 15;

    initData();

    $scope.queryItems = [
        {
            name: '全部',
            value: 0
        },
        {
            name: '无操作',
            value: 1
        },
        {
            name: '今日登陆的',
            value: 2
        },
        {
            name: '预约实盘的',
            value: 3
        }
    ];

    $scope.queryItem = function(item) {
        $scope.currentUsers = users.filter(function (user) {
            if (!item.value) return true;
            if (item.value === 2) {
                return user.wechat.logged;
            }
            if (item.value === 1) {
                return user.wechat.trader.lastCash === 0;
            }
            if (item.value === 3) {
                return user.wechat.appointment;
            }
        });
        pageReset();
    };

    function initData() {
        $http.get('/admin/api/get_all_ppj_user')
            .success(function(data, status) {
                $scope.currentUsers = users = data;
                pageReset();
            })
            .error(function(data, status) {
                gbNotifier.error('错误:' + data.error_msg);
            });
    }

    function pageReset() {
        $scope.totalItems = $scope.currentUsers.length;
        $scope.currentPage = 1;
        $scope.pageChanged();
    }

    $scope.pageChanged = function() {
        var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        var end = start + $scope.itemsPerPage;
        if (end > $scope.totalItems) {
            end = $scope.totalItems;
        }
        $scope.showingItems = $scope.currentUsers.slice(start, end);
    };

    $scope.showUserDetail = function(mobile) {
        alert(mobile);
        $scope.data.searchKey = mobile;
        $location.path('user_page');
    };
}]);
