'use strict';
angular.module('futuresApp').controller('FuturesOrdersCtrl', ['$scope', '$window', '$http', function($scope, $window, $http) {
    $scope.user = $scope.data.currentUser;

    $http.get('/api/futures/get_orders')
        .success(function(data, status) {
            var str = '';
            for (var key in data[0]) {
                str += 'key:' + key + ' value:' + data[0][key];
            }
            alert(str);
        })
        .error(function(data, status) {

        });
}]);