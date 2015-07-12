'use strict';
angular.module('futuresApp').controller('FuturesUserRankCtrl', ['$scope', '$window', '$location', '$http', function($scope, $window, $location, $http) {
    $http.get('/api/futures/user_rank')
        .success(function(data, status) {
            var users = data.users;
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
        $location.path('/futures');
    }

}]);