'use strict';
angular.module('myApp').controller('UserWithdrawController', ['gbIdentity', 'gbNotifier', '$location', 'gbCard', 'gbCachedCards', 'gbOrder', '$http', function(gbIdentity, gbNotifier, $location, gbCard, gbCachedCards, gbOrder, $http) {
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
        var regex = /^(\d{16}|\d{19})$/;
        if (!regex.test(vm.card.cardID)) {
            gbNotifier.error('无效的银行卡号');
            return;
        }
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
                    dealType: 2,
                    amount: vm.amount,
                    description: '余额提现',
                    cardInfo: {
                        bankName: vm.selected.bankName,
                        cardID: vm.selected.cardID,
                        userName: vm.selected.userName
                    }
                };
                var data = {
                    order: order,
                    password: vm.password
                };

                $http.post('/user/withdraw', data)
                    .success(function(data, status, headers, config) {
                        vm.user.finance.freeze_capital += order.amount;
                        vm.user.finance.balance -= order.amount;
                        gbNotifier.notify('您的提现申请已经提交,我们会尽快处理');

                    })
                    .error(function(data, status, headers, config) {
                        gbNotifier.error('提现申请提交失败 ' + data.reason);
                    });
                /*
                $http.post('/user/verify_finance_password', {password:vm.password})
                    .then(function(response) {
                        if (response.data.success) {
                            var order = {
                                userID: vm.user._id,
                                dealType: '提现',
                                amount: vm.amount,
                                description: '余额提现',
                                cardInfo: {
                                    bankName: vm.selected.bankName,
                                    cardID: vm.selected.cardID,
                                    userName: vm.selected.userName
                                }
                            };
                            var newOrder = new gbOrder(order);
                            newOrder.$save().then(function(response) {
                                var data = {
                                    finance: {
                                        freeze_capital: order.amount
                                    }
                                };
                                $http.post('/api/users/' + vm.user._id, data)
                                    .success(function(data, status, headers, config) {
                                        vm.user.finance.freeze_capital += order.amount;
                                        gbNotifier.notify('提现申请提交成功');

                                    })
                                    .error(function(data, status, headers, config) {

                                    });

                                vm.user.orders.push(response.order);
                            }, function(response) {
                                gbNotifier.error('提现申请提交失败 ' + response.data.reason);
                            });
                            gbNotifier.notify('提现 ' + vm.amount);
                        } else {
                            gbNotifier.error('提现申请提交失败 ' + response.data.reason);
                        }
                    });
                    */
            }
        }
    };
}]);
