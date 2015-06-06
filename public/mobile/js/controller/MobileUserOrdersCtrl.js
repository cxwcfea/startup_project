'use strict';
angular.module('mobileApp').controller('MobileUserOrdersCtrl', ['$scope', '$window', '$http', function($scope, $window, $http) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {}
        }
        $scope.data.lastLocation = '/invest_list';
        $location.path('/login');
    } else {
        vm.showSelectList = false;
        vm.queryItems = [
            {
                name: '全部',
                value: 0
            },
            {
                name: '保证金明细',
                value: 1
            },
            {
                name: '管理费明细',
                value: 2
            },
            {
                name: '充值提现',
                value: 3
            },
            {
                name: '收益明细',
                value: 4
            }
        ];
        vm.selectedItem = 0;
        if ($scope.data.ongoingAmount === null || $scope.data.ongoingAmount === undefined) {
            $http.get('/api/user/invest_detail')
                .success(function(data, status) {
                    vm.ongoingAmount = 0;
                    vm.ongoingProfit = 0;
                    data.forEach(function(elem) {
                        vm.ongoingAmount += elem.amount;
                        vm.ongoingProfit += elem.investProfit;
                    });
                    vm.total_capital = vm.user.finance.deposit + vm.user.finance.freeze_capital + vm.ongoingAmount + vm.user.invest.availableAmount + vm.user.finance.balance;
                })
                .error(function(data, status) {
                    console.log(data.error_msg);
                    vm.ongoingAmount = 0;
                    vm.ongoingProfit = 0;
                });
        } else {
            vm.ongoingAmount = $scope.data.ongoingAmount;
            vm.total_capital = vm.user.finance.deposit + vm.user.finance.freeze_capital + vm.ongoingAmount + vm.user.invest.availableAmount + vm.user.finance.balance;
        }
        $http.get('/api/mobile/user_orders')
            .success(function(data, status) {
                vm.orders = data;
                vm.selectItem(vm.queryItems[0]);
            })
            .error(function(data, status) {
                console.log(data.error_msg);
            });

        vm.toggleSelectList = function() {
            vm.showSelectList = !vm.showSelectList;
        };
        vm.selectItem = function(item) {
            vm.selectedItem = item.value;
            vm.showSelectList = false;
            vm.showingItem = vm.orders.filter(function(elem) {
                switch (item.value) {
                    case 0:
                        return true;
                    case 1:
                        return elem.dealType === 5 || elem.dealType === 9;
                    case 2:
                        return elem.dealType === 8 || elem.dealType === 10;
                    case 3:
                        return elem.dealType === 1 || elem.dealType === 2;
                    case 4:
                        return elem.dealType === 12;
                    default :
                        return true;
                }
            });
        }
    }
}]);
