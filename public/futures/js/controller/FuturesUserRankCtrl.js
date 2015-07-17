'use strict';
angular.module('futuresApp').controller('FuturesUserRankCtrl', ['$scope', '$window', '$location', '$http', '$filter', function($scope, $window, $location, $http, filter) {
    $scope.user = $scope.data.currentUser;

    $http.get('/api/futures/user_rank')
        .success(function(data, status) {
            var users = data.users;
            users.sort(function(x, y) {
                return y.wechat.trader.cash - x.wechat.trader.cash;
            });
            var length = Math.min(users.length, 8);
            $scope.userInRank = false;
            alert($scope.user.wechat.wechat_uuid);
            for (var i = 0; i < length; ++i) {
                if ($scope.user.wechat.wechat_uuid == users[i].wechat.wechat_uuid) {
                    $scope.userInRank = true;
                    break;
                }
            }
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