'use strict';
angular.module('mobileApp').controller('MobileRechargeRecordCtrl', ['$scope', '$window', '$resource', function($scope, $window, $resource) {
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
        var OrderResource = $resource('/api/alipay/orders', {});
        vm.orderList = OrderResource.query(function () {
        });
    }


}]);