'use strict';
angular.module('adminApp').controller('AdminPPJControlPanelCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', function($scope, $location, $routeParams, $modal, $http, gbNotifier) {
    $scope.startCtp = function() {
        $http.get('/futures/start_ctp')
            .success(function(data, status) {
                gbNotifier.notify('成功');
            })
            .error(function(data, status) {
                gbNotifier.error('失败');
            })
    };

    $scope.stopCtp = function() {
        $http.get('/futures/stop_ctp')
            .success(function(data, status) {
                gbNotifier.notify('成功');
            })
            .error(function(data, status) {
                gbNotifier.error('失败');
            })
    };
}]);