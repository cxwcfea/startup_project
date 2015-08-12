'use strict';
angular.module('adminApp').controller('AdminPPJTradeUserCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', function($scope, $location, $routeParams, $modal, $http, gbNotifier) {
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
            name: '还未签署协议的',
            value: 1
        }
        /*
        {
            name: '今日登陆的',
            value: 2
        }
        */
    ];

    $scope.queryItem = function(item) {
        $scope.currentUsers = users.filter(function (user) {
            if (!item.value) return true;
            return user.wechat.status === item.value;
        });
        pageReset();
    };

    function initData() {
        $http.get('/admin/api/get_ppj_trade_user')
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
            $http.get('/futures/approve_user/?uid=' + user._id)
                .success(function(data, status) {
                    _.remove(users, function(u) {
                        return u._id === user._id;
                    });
                    $scope.currentUsers = users;
                    pageReset();
                    gbNotifier.notify('成功');
                })
                .error(function(data, status) {
                    gbNotifier.notify('错误:' + data.error_msg);
                });
        } else {
            console.log('no');
        }
    };
}]);