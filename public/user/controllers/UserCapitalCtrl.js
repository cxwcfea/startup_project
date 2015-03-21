'use strict';
angular.module('userApp').controller('UserCapitalCtrl', ['$scope', 'njOrder', 'njCard', 'BankNameList', 'gbNotifier', function($scope, njOrder, njCard, BankNameList, gbNotifier) {
    var vm = this;
    $('.footer').addClass('marTop200');

    $scope.data.menu = 2;
    vm.user = $scope.data.currentUser;

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
            currentOrders = order_list;
            console.log(currentOrders.length);
            pageReset();
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
            return elem.dealType === item.value;
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
            name: '充值',
            value: 1
        },
        {
            name: '提现',
            value: 2
        },
        {
            name: '盈利提取',
            value: 3
        },
        {
            name: '股票盈利',
            value: 4
        },
        {
            name: '保证金返还',
            value: 5
        },
        {
            name: '追加配资保证金',
            value: 6
        }
    ];

    vm.categories = [
        {
            file: '/views/recharge.html',
            name: '充值',
            menu: 0,
            value: 0
        },
        {
            file: '/views/withdraw.html',
            name: '提现',
            menu: 1,
            value: 1
        },
        {
            file: '/views/user_orders.html',
            name: '资金明细',
            menu: 2,
            value: 2
        },
        {
            file: '/views/my_cards.html',
            name: '我的银行卡',
            menu: 3,
            value: 3
        },
        {
            file: '/views/add_card.html',
            name: '我的银行卡',
            menu: 3,
            value: 4
        }
    ];

    vm.currentCategory = vm.categories[2];

    vm.selectCategory = function(c) {
        vm.currentCategory = c;
    };

    vm.selectedCategory = function() {
        return vm.currentCategory.file;
    };

    vm.showAddCard = function() {
        vm.currentCategory = vm.categories[4];
    };

    vm.excludeAddCard = function (item) {
        return item.value != 4;
    };

    vm.addCard = function() {
        if (!vm.bankName) {
            gbNotifier.error('请输入支行名称!');
            return;
        }
        var regex = /^(\d{16}|\d{19})$/;
        if (!regex.test(vm.cardID)) {
            gbNotifier.error('银行卡号格式不正确');
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
            gbNotifier.notify('银行卡添加成功!');
            console.log(c);
            //vm.cards.push(vm.card);
        }, function(response) {
            gbNotifier.error('添加失败 ' + response.data.reason);
        });
    };

}]);