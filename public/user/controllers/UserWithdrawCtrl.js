'use strict';
angular.module('userApp2').controller('UserWithdrawCtrl', ['$scope', '$http', '$window', '$location', '$routeParams', '$filter', 'njOrder', 'njCard', 'BankNameList', function($scope, $http, $window, $location, $routeParams, $filter, njOrder, njCard, BankNameList) {
    var vm = this;

    $scope.data.menu = 3;
    vm.step = 1;
    vm.user = $scope.data.currentUser;
    vm.cards = njCard.query({uid:vm.user._id}, function() {
        if (vm.cards.length === 0) {
            $location.path('/add_card');
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
                _.remove(vm.cards, function(c) {
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
            console.log(vm.withdrawAmount);
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
            var order = {
                userID: vm.user._id,
                userMobile: vm.user.mobile,
                dealType: 2,
                amount: vm.withdrawAmount,
                description: '余额提现',
                cardInfo: {
                    bank: BankNameList[vm.cards[0].bankID].name,
                    bankName: vm.cards[0].bankName,
                    cardID: vm.cards[0].cardID,
                    province: vm.cards[0].province,
                    city: vm.cards[0].city,
                    userName: vm.cards[0].userName
                }
            };
            var data = {
                order: order
            };

            $http.post('/user/withdraw', data)
                .success(function(data, status, headers, config) {
                    vm.user.finance.freeze_capital += order.amount;
                    vm.user.finance.balance -= order.amount;
                    vm.step = 3;
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', '提现申请提交失败,请联系客服!');
                });
        }
    };

}]);