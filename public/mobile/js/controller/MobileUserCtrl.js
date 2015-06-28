'use strict';
angular.module('mobileApp').controller('MobileUserCtrl', ['$scope', '$window', '$location', '$http', '$timeout', 'njCard', 'BankNameList', function($scope, $window, $location, $http, $timeout, njCard, BankNameList) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {};
        }
        $scope.data.lastLocation = '/user';
        $location.path('/login');
    } else {
        var cards = njCard.query({uid:vm.user._id}, function() {
            if (cards.length > 0) {
                vm.withdrawCard = cards.pop();
                vm.withdrawCardName = BankNameList[vm.withdrawCard.bankID].name;
            }
        });
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

    vm.addCard = function() {
        if (vm.withdrawCard.type === 2) {
            vm.errorMsg = '您的提现银行卡已绑定为支付时的银行卡!';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 3500);
            return;
        }
        $location.path('/add_card');
    };

    vm.viewFile = function () {
        return "/mobile/user.html";
    };

    vm.gotoInvestCenter = function() {
        $location.path('/user_invest_center')
        /*
        if (!vm.user.invest.enable) {
            $location.path('/invest')
        } else {
            $location.path('/user_invest_center')
        }
        */
    }
}]);
