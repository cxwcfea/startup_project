'use strict';
angular.module('mobileApp').controller('MobileInvestListCtrl', ['$scope', '$window', '$location', '$timeout', '$http', function($scope, $window, $location, $timeout, $http) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {}
        }
        $scope.data.lastLocation = '/invest_list';
        $location.path('/login');
    } else {
        vm.inputError = false;
        vm.investDetail = false;

        $http.get('/api/user/invest_orders')
            .success(function(data, status) {
                vm.investList = data.orders.map(function(o) {
                    for (var i = 0; i < data.contracts.length; ++i) {
                        if (o.contractID === data.contracts[i]._id) {
                            o.borrower = data.contracts[i].userMobile;
                            o.totalAmount = data.contracts[i].amount;
                            o.returnTime = data.contracts[i].endTime;
                            o.period = data.contracts[i].period;
                            break;
                        }
                    }
                    return o;
                });
            })
            .error(function(data, status) {
                vm.errorMsg = data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
            });

        vm.showInvestDetail = function(invest) {
            vm.currentInvest = invest;
            vm.investDetail = true;
        };
    }
}]);