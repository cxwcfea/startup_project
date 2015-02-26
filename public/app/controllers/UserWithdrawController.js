'use strict';
angular.module('myApp').controller('UserWithdrawController', ['gbIdentity', 'gbNotifier', '$location', 'gbCard', 'gbCachedCards', 'gbOrder', function(gbIdentity, gbNotifier, $location, gbCard, gbCachedCards, gbOrder) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.cards = [];
    vm.card = {};

    vm.card.userID = vm.user._id;

    if (vm.user.identity.name) {
        vm.card.userName = vm.user.identity.name;
    }

    gbCachedCards.setUID(vm.user._id);
    vm.cards = gbCachedCards.query();

    vm.selectCard = function(card) {
        vm.selected = card;
    };

    vm.isSelected = function(card) {
        return vm.selected === card;
    };

    vm.addCard = function() {
        console.log();
        var newCard = new gbCard(vm.card);

        newCard.$save().then(function() {
            gbNotifier.notify('添加成功');
            vm.cards.push(vm.card);
        }, function(response) {
            gbNotifier.error('添加失败 ' + response.data.reason);
        });
    };

    vm.withdraw = function() {
        if (!vm.selected) {
            gbNotifier.error('请选择要提现的银行卡');
        } else {
            if (vm.amount <= 0 || vm.amount > vm.user.finance.balance) {
                gbNotifier.error('无效的提现金额：' + vm.amount);
            } else {
                var order = {
                    userID: vm.user._id,
                    dealType: '提现',
                    amount: vm.amount,
                    description: '10倍配资'
                };
                var newOrder = new gbOrder(order);
                newOrder.$save().then(function(response) {
                    gbNotifier.notify('提现申请提交成功');
                    if (response.order.status) {
                        response.order.status = '交易成功';
                    } else {
                        response.order.status = '交易失败';
                    }
                    vm.user.orders.push(response.order);
                }, function(response) {
                    gbNotifier.error('提现申请提交失败 ' + response.data.reason);
                });
                gbNotifier.notify('提现 ' + vm.amount);
            }
        }
    }
}]);
