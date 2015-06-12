'use strict';
angular.module('mobileApp').controller('MobileUserInvestCenterCtrl', ['$scope', '$window', '$location', '$http', '$timeout', function($scope, $window, $location, $http, $timeout) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {};
        }
        $scope.data.lastLocation = '/user_invest_center';
        $location.path('/login');
    } else {
        $http.get('/api/user/invest_detail')
            .success(function(data, status) {
                vm.ongoingAmount = 0;
                vm.ongoingProfit = 0;
                data.forEach(function(elem) {
                    vm.ongoingAmount += elem.amount;
                    vm.ongoingProfit += elem.investProfit;
                });
                $scope.data.ongoingAmount = vm.ongoingAmount;
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
        return "/mobile/user_invest.html";
    };

    vm.transToBalance = function() {
        vm.transMoney = true;
    };

    vm.confirmTransMoney = function() {
        if (!vm.trans_amount) {
            vm.errorMsg = '请输入欲转出金额';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        var data = {
            amount: vm.trans_amount
        };
        $http.post('/api/user/invest_to_balance', data)
            .success(function(data, status) {
                vm.transSuccess = true;
                vm.user.finance.balance += vm.trans_amount;
                vm.user.invest.availableAmount -= vm.trans_amount;
            })
            .error(function(data, status) {
                vm.errorMsg = data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
            });
    };

    vm.closeDialogWindow = function() {
        vm.transSuccess = false;
        vm.transMoney = false;
    }
}]);