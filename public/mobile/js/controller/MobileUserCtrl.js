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
    }

    vm.menu = 4;

    vm.logout = function() {
        $http.post('/logout', {})
            .success(function(data, status) {
                $scope.data.currentUser = null;
                $window.bootstrappedUserObject = null;
                $location.path('/');
            })
            .error(function(data, status) {

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
}]);