'use strict';
angular.module('adminApp').controller('AdminAppointUserListCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', function($scope, $location, $routeParams, $modal, $http, gbNotifier) {
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
        });
        pageReset();
    };

    function initData() {
        $http.get('/admin/api/get_appoint_ppj_user')
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

    $scope.approveRealTrade = function(user) {
        var result = prompt('确定吗');
        if (result != null) {
            console.log('yes');
        } else {
            console.log('no');
        }
    };
}]);