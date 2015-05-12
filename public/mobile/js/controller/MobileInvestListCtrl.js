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
                            o.deposit = data.contracts[i].deposit;
                            o.sellValue = data.contracts[i].sellValue;
                            o.contractStatus = data.contracts[i].status;
                            break;
                        }
                    }
                    return o;
                });
                vm.finishedInvestList = vm.investList.filter(function(elem) {
                    return elem.contractStatus === 2;
                });
                vm.ongoingInvestList = vm.investList.filter(function(elem) {
                    return elem.contractStatus === 1;
                });
                vm.returnedCapital = 0;
                vm.finishedInvestList.forEach(function(elem) {
                    vm.returnedCapital += elem.amount;
                });
                vm.ave_profit_rate = 0;
                if (vm.returnedCapital > 0 && vm.user.finance.history_invest_profit > 0) {
                    vm.ave_profit_rate = (vm.user.finance.history_invest_profit / vm.returnedCapital * 100);
                }
                vm.changeList(1);
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

        vm.showContractDetail = function() {
            vm.investDetail = false;
            vm.contractDetail = true;
        };

        vm.changeList = function(num) {
            vm.currentShowing = num;
            switch (num) {
                case 1:
                    vm.showingItems = vm.investList;
                    break;
                case 2:
                    vm.showingItems = vm.ongoingInvestList;
                    break;
                case 3:
                    vm.showingItems = vm.finishedInvestList;
                    break;
                default:
                    vm.showingItems = vm.investList;
                    break;
            }
        }
    }
}]);