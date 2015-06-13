'use strict';
angular.module('userApp').controller('UserWithdrawCtrl', ['$scope', '$http', '$window', '$location', '$routeParams', '$filter', 'njOrder', 'njCard', 'BankNameList', function($scope, $http, $window, $location, $routeParams, $filter, njOrder, njCard, BankNameList) {
    var vm = this;

    $scope.data.menu = 3;
    vm.step = 1;
    vm.user = $scope.data.currentUser;
    var cards = njCard.query({uid:vm.user._id}, function() {
        if (cards.length === 0) {
            $location.path('/add_card');
        } else {
            vm.card = cards.pop();
        }
    });

    vm.BankNameList = BankNameList;
    vm.bankObj = vm.BankNameList[0];

    vm.alerts = [];

    var addAlert = function(type, msg) {
        vm.alerts = [];
        vm.alerts.push({type:type, msg: msg});
    };

    vm.closeAlert = function(index) {
        vm.alerts.splice(index, 1);
    };

    vm.deleteCard = function(card) {
        $http.post('/api/delete/card/' + card._id, {card: card})
            .success(function(data, status) {
                _.remove(cards, function(c) {
                    return c._id === card._id;
                });
            })
            .error(function(data, status) {
                addAlert('danger', '删除失败，请稍后再试');
            });
    };

    vm.selectCard = function(card) {
        vm.selectedCard = card;
    };

    vm.withdrawNextStep = function() {
        if (vm.step === 1) {
            if (!vm.withdrawAmount || vm.withdrawAmount <= 0) {
                addAlert('danger', '请输入提现金额,金额不超过余额且大于0,');
                return;
            }
            vm.withdrawAmount = Number(vm.withdrawAmount.toFixed(2));
            var balance = Number(vm.user.finance.balance.toFixed(2));
            if (vm.withdrawAmount > balance) {
                addAlert('danger', '余额不足!');
                return;
            }
            vm.step = 2;
        } else if (vm.step === 2) {
            var orderData = {
                amount: vm.withdrawAmount,
                description: '余额提现',
                cardInfo: {
                    bank: BankNameList[vm.card.bankID].name,
                    bankName: vm.card.bankName,
                    cardID: vm.card.cardID,
                    province: vm.card.province,
                    city: vm.card.city,
                    userName: vm.card.userName
                }
            };

            $http.post('/user/withdraw', orderData)
                .success(function(data, status, headers, config) {
                    vm.user.finance.freeze_capital += orderData.amount;
                    vm.user.finance.balance -= orderData.amount;
                    vm.step = 3;
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', '提现申请提交失败,请联系客服! ' + data.error_msg);
                });
        }
    };

}]);