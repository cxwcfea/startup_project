'use strict';
angular.module('futuresApp').controller('FuturesUserRankCtrl', ['$scope', '$window', '$location', '$http', '$filter', function($scope, $window, $location, $http, filter) {
    $http.get('/api/futures/user_rank')
        .success(function(data, status) {
            var users = data.users;
            users.sort(function(x, y) {
                return y.wechat.trader.cash - x.wechat.trader.cash;
            });
            $scope.goldUser = users.shift();
            if (!$scope.goldUser) {
                $scope.goldUser = {};
            }
            $scope.silverUser = users.shift();
            if (!$scope.silverUser) {
                $scope.silverUser = {};
            }
            $scope.copperUser = users.shift();
            if (!$scope.copperUser) {
                $scope.copperUser = {};
            }
            $scope.topUsers = users;
            $scope.userInRank = data.userInRank;
        })
        .error(function(data, status) {
            $scope.goldUser = {};
            $scope.silverUser = {};
            $scope.copperUser = {};
            $scope.topUsers = [];
        });

    $scope.trade = function() {
        $window.location.assign('/futures');
    }

}]);