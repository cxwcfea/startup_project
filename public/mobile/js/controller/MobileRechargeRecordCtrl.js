'use strict';
angular.module('mobileApp').controller('MobileRechargeRecordCtrl', ['$scope', '$window', '$resource', '$location', function($scope, $window, $resource, $location) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    vm.orderList = {};
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {};
        }
        $scope.data.lastLocation = '/recharge_record';
        $location.path('/login');
    } else {
        var OrderResource = $resource('/api/mobile_recharge/orders', {});
        vm.orderList = OrderResource.query().$promise.then(function(value) {
                vm.orderList = value;
            }, function(reason) {
                if (!$scope.data) {
                    $scope.data = {};
                }
                $scope.data.lastLocation = '/recharge_record';
                $location.path('/login');
            });
    }

}]);