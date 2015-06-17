https://www.jr1.cn/PPBao/wealth/index.shtml'use strict';
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
                            o.returnTime = moment(data.contracts[i].endTime).add(1, 'days').toDate();
                            o.closeAt = data.contracts[i].closeAt;
                            o.period = data.contracts[i].period;
                            o.deposit = data.contracts[i].deposit;
                            o.sellValue = data.contracts[i].sellValue;
                            o.contractStatus = data.contracts[i].status;
                            o.investAt = data.contracts[i].startAt;
                            o.contractSerialID = data.contracts[i].serialID;
                            break;
                        }
                    }
                    return o;
                });
                vm.finishedInvestList = vm.investList.filter(function(elem) {
                    return elem.status === 1;
                });
                vm.ongoingInvestList = vm.investList.filter(function(elem) {
                    return elem.status === 2;
                });
                vm.returnedCapital = 0;
                var totalProfit = 0;
                var investDays = 0;
                vm.finishedInvestList.forEach(function(elem) {
                    totalProfit += elem.investProfit;
                    investDays += Number(elem.duration);
                    vm.returnedCapital += elem.amount;
                });
                vm.ave_profit_rate = 0;
                if (vm.finishedInvestList.length > 0) {
                    vm.ave_profit_rate = totalProfit / investDays * 365 / vm.returnedCapital * 100;
                }
                if (vm.ave_profit_rate > 0) {
                    vm.ave_profit_rate = 15;
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
            vm.daysLeft = moment(invest.returnTime).diff(moment(), 'days');
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