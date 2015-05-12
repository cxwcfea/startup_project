'use strict';
angular.module('mobileApp').controller('MobileUserCtrl', ['$scope', '$window', '$location', '$http', function($scope, $window, $location, $http) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {};
        }
        $scope.data.lastLocation = '/user';
        $location.path('/login');
    } else {
        $http.get('/api/user/invest_detail')
            .success(function(data, status) {
                vm.ongoingAmount = 0;
                vm.ongoingProfit = 0;
                data.forEach(function(elem) {
                    vm.ongoingAmount += elem.amount;
                    vm.ongoingProfit += elem.investProfit;
                })
            })
            .error(function(data, status) {
                console.log(data.error_msg);
                vm.ongoingAmount = 0;
                vm.ongoingProfit = 0;
            });
    }

    vm.menu = 4;
    vm.showInvest = false;

    vm.logout = function() {
        $http.post('/logout', {})
            .success(function(data, status) {
                $scope.data.currentUser = null;
                $window.bootstrappedUserObject = null;
                $location.path('/');
            })
            .error(function(data, status) {
                console.log('logout err:' + data.error_msg);
            });
    };

    vm.viewFile = function () {
        return vm.showInvest ? "/mobile/user_invest.html" : "/mobile/user.html";
    };

}]);