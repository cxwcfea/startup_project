'use strict';
angular.module('userApp').controller('UserCapitalCtrl', ['$scope', '$http', '$window', '$location', '$routeParams', '$filter', 'njOrder', 'njCard', 'BankNameList', 'gbNotifier', 'njCachedCards', function($scope, $http, $window, $location, $routeParams, $filter, njOrder, njCard, BankNameList, gbNotifier, njCachedCards) {
    var vm = this;
    $('.footer').addClass('marTop200');

    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/user_capital") === 0) {
            var request_category = $location.search()['category'];
            if (!request_category || request_category > 2) {
                request_category = 1;
            }
            vm.currentCategory = vm.categories[request_category];
        }
    });

    $scope.data.menu = 2;
    vm.user = $scope.data.currentUser;
    njCachedCards.setUID(vm.user._id);
    vm.cards = njCachedCards.query();

    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 6;
    vm.selected = 0;
    vm.tableCss = {
        even:  'even'
    };

    initData();
    vm.BankNameList = BankNameList;
    vm.bankObj = vm.BankNameList[0];

    function initData() {
        order_list = njOrder.query({uid:vm.user._id}, function () {
            order_list = $filter('orderBy')(order_list, 'createdAt', true);
            currentOrders = order_list;
            pageReset();
            if (vm.pay_order_id) {
                vm.pay_order = _.find(order_list, { '_id': vm.pay_order_id });
                if (vm.pay_order) {
                    vm.pay_amount = Number(vm.pay_order.amount.toFixed(2));
                    if (vm.pay_order.applySerialID) {
                        vm.pay_for_apply = true;
                    }
                }
            }
        });
    }

    function pageReset() {
        vm.totalItems = currentOrders.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.queryItem = function (item) {
        vm.selected = item.value;
        currentOrders = order_list.filter(function (elem) {
            if (!item.value) return true;
            if (item.value === 2) {
                return elem.dealType === 2 || elem.dealType === 9;
            } else {
                return elem.dealType !== 2 && elem.dealType !== 9;
            }
        });
        pageReset();
    };

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentOrders.slice(start, end);
    };

    vm.queryItems = [
        {
            name: '全部',
            value: 0
        },
        {
            name: '资金流入',
            value: 1
        },
        {
            name: '资金流出',
            value: 2
        }
    ];

    vm.categories = [
        {
            file: '/views/withdraw.html',
            name: '提现',
            menu: 0,
            value: 0
        },
        {
            file: '/views/user_orders.html',
            name: '资金明细',
            menu: 1,
            value: 1
        },
        {
            file: '/views/my_cards.html',
            name: '我的银行卡',
            menu: 2,
            value: 2
        },
        {
            file: '/views/add_card.html',
            name: '我的银行卡',
            menu: 2,
            value: 3
        }
    ];

    vm.payTypes = [
        {
            name: '网银充值',
            value: 0
        },
        {
            name: '支付宝转账',
            value: 1
        },
        {
            name: '银行汇款',
            value: 2
        }
    ];

    vm.alerts = [];

    var addAlert = function(type, msg) {
        vm.alerts.push({type:type, msg: msg});
    };

    vm.closeAlert = function(index) {
        vm.alerts.splice(index, 1);
    };

    vm.selectCategory = function(c) {
        vm.currentCategory = c;
        if ($location.search()["pay_order"]) {
            $location.search('pay_order', null);
        }
        if (c.value === 2 || c.value === 0) {
            if (vm.cards.length > 0) {
                vm.selectedCard = vm.cards[0];
            }
        } else if (c.value === 2) {
            pageReset();
        }
        vm.alerts = [];
    };

    vm.selectedCategory = function() {
        return vm.currentCategory.file;
    };

    vm.showAddCard = function() {
        vm.alerts = [];
        vm.currentCategory = vm.categories[3];
    };

    vm.excludeAddCard = function (item) {
        return item.value != 3;
    };

    vm.addCard = function() {
        if (!vm.bankName) {
            addAlert('danger', '请输入支行名称');
            console.log(vm.alerts);
            return;
        }
        var regex = /^(\d{16}|\d{19})$/;
        if (!regex.test(vm.cardID)) {
            addAlert('danger', '银行卡号格式不正确');
            return;
        }
        var cardObj = {
            userID: vm.user._id,
            bankID: vm.bankObj.value,
            bankName: vm.bankName,
            cardID: vm.cardID,
            userName: vm.user.identity.name
        };
        var newCard = new njCard(cardObj);
        newCard.$save(function(c, responseHeaders) {
            vm.alerts = [];
            addAlert('success', '银行卡添加成功!');
            vm.cards.push(c);
            vm.cardID = '';
            vm.bankName = '';
            vm.currentCategory = vm.categories[2];
        }, function(response) {
            addAlert('success', '添加失败 ' + response.data.error_msg);
        });
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
                order_list.unshift(data.order);
                currentOrders = order_list;
                pageReset();
                addAlert('success', '您的提现申请已经提交,我们会尽快处理!');
            })
            .error(function(data, status, headers, config) {
                addAlert('danger', '提现申请提交失败,请联系客服!');
            });
    };

    vm.showRechargeDetail = function() {
        vm.currentCategory = vm.categories[2];
        vm.queryItem(vm.queryItems[1]);
    };

    vm.showWithdrawDetail = function() {
        vm.currentCategory = vm.categories[2];
        vm.queryItem(vm.queryItems[2]);
    };
}]);