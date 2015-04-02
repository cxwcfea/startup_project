'use strict';
angular.module('userApp2').controller('UserWithdrawCtrl', ['$scope', '$http', '$window', '$location', '$routeParams', '$filter', 'njOrder', 'njCard', 'BankNameList', 'gbNotifier', 'njCachedCards', function($scope, $http, $window, $location, $routeParams, $filter, njOrder, njCard, BankNameList, gbNotifier, njCachedCards) {
    var vm = this;

    $scope.data.menu = 6;
    vm.step = 1;
    vm.user = $scope.data.currentUser;
    njCachedCards.setUID(vm.user._id);
    vm.cards = njCachedCards.query();

    if (vm.cards.length > 0) {
        vm.selectedCard = vm.cards[0];
    }

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

    vm.withdraw = function() {
        if (!vm.user.finance.password) {
            addAlert('danger', '您还未设置提现密码，请先设置提现密码');
            return;
        }
        if (!vm.withdrawAmount || vm.withdrawAmount < 0) {
            addAlert('danger', '请输入有效的提现金额!');
            return;
        }
        var withdrawAmount = Number(vm.withdrawAmount.toFixed(2));
        var balance = Number(vm.user.finance.balance.toFixed(2));
        if (withdrawAmount > balance) {
            addAlert('danger', '余额不足!');
            return;
        }
        if (!vm.finance_password) {
            addAlert('danger', '请输入提现密码!');
            return;
        }
        if (!vm.selectedCard) {
            addAlert('danger', '请选择提现的银行卡!');
            return;
        }
        var order = {
            userID: vm.user._id,
            userMobile: vm.user.mobile,
            dealType: 2,
            amount: withdrawAmount,
            description: '余额提现',
            cardInfo: {
                bank: BankNameList[vm.selectedCard.bankID].name,
                bankName: vm.selectedCard.bankName,
                cardID: vm.selectedCard.cardID,
                userName: vm.selectedCard.userName
            }
        };
        var data = {
            order: order,
            password: vm.finance_password
        };

        $http.post('/user/withdraw', data)
            .success(function(data, status, headers, config) {
                vm.user.finance.freeze_capital += order.amount;
                vm.user.finance.balance -= order.amount;
                pageReset();
                addAlert('success', '您的提现申请已经提交,我们会尽快处理!');
            })
            .error(function(data, status, headers, config) {
                addAlert('danger', '提现申请提交失败,请联系客服!');
            });
    };

    vm.withdrawNextStep = function() {
        if (vm.step === 1) {
            if (!vm.withdrawAmount || vm.withdrawAmount <= 0) {
                addAlert('danger', '请输入提现金额,金额不超过余额且大于0,');
                return;
            }
            vm.withdrawAmount = Number(vm.withdrawAmount.toFixed(2));
            var balance = Number(vm.user.finance.balance.toFixed(2));
            console.log(vm.withdrawAmount + ' ' + balance);
            if (vm.withdrawAmount > balance) {
                addAlert('danger', '余额不足');
                return;
            }
            vm.step = 2;
        }
    }

}]);