'use strict';
angular.module('userApp').controller('UserCapitalCtrl', ['$scope', '$http', '$window', '$location', '$routeParams', '$filter', 'njOrder', 'njCard', 'BankNameList', 'gbNotifier', 'njCachedCards', function($scope, $http, $window, $location, $routeParams, $filter, njOrder, njCard, BankNameList, gbNotifier, njCachedCards) {
    var vm = this;
    $('.footer').addClass('marTop200');

    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/user_capital") === 0) {
            var order_id = $location.search()["pay_order"];
            if (order_id) {
                vm.currentCategory = vm.categories[0];
                vm.pay_order_id = order_id;
            } else {
                var request_category = $location.search()['category'];
                if (!request_category || request_category > 2) {
                    request_category = 1;
                }
                vm.currentCategory = vm.categories[request_category];
            }
        }
    });

    $scope.data.menu = 1;
    vm.user = $scope.data.currentUser;
    njCachedCards.setUID(vm.user._id);
    vm.cards = njCachedCards.query();
    vm.currentPayType = 0;
    vm.useCredit = false;

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
    vm.payBank = 0;

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
        if (c.value === 3 || c.value === 1) {
            if (vm.cards.length > 0) {
                vm.selectedCard = vm.cards[0];
            }
        } else if (c.value === 2) {
            pageReset();
        }
    };

    vm.selectedCategory = function() {
        return vm.currentCategory.file;
    };

    vm.showAddCard = function() {
        vm.currentCategory = vm.categories[4];
    };

    vm.excludeAddCard = function (item) {
        return item.value != 3;
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
            vm.cards.push(c);
        }, function(response) {
            gbNotifier.error('添加失败 ' + response.data.reason);
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

    vm.selectPayType = function (type) {
        vm.currentPayType = type.value;
    };

    vm.selectPayBank = function (bank) {
        vm.payBank = bank.value;
        console.log('selectPayBank ' + vm.payBank);
    };

    vm.changeCardType = function(credit) {
        vm.useCredit = credit;
        if (vm.useCredit) {
            vm.BankNameList = BankNameList.filter(function (element, index, array) {
                return element.credit;
            });
        } else {
            vm.BankNameList = BankNameList;
        }
    };

    function payThroughShengPay(order) {
        var Name = $('#Name')[0].value;
        var Version = $('#Version')[0].value;
        var Charset = $('#Charset')[0].value;
        var MsgSender = $('#MsgSender')[0].value;
        var OrderNo = $('#OrderNo')[0].value = order._id;
        var OrderAmount = $('#OrderAmount')[0].value = order.amount.toFixed(2);
        var OrderTime = $('#OrderTime')[0].value = moment().format("YYYYMMDDHHmmss");
        var PayType = $('#PayType')[0].value;
        var PayChannel = $('#PayChannel')[0].value = vm.useCredit ? 20 : 19;
        var InstCode = $('#InstCode')[0].value = BankNameList[vm.payBank].instCode;
        var PageUrl = $('#PageUrl')[0].value;
        var BackUrl = $('#BackUrl')[0].value;
        var NotifyUrl = $('#NotifyUrl')[0].value;
        var ProductName = $('#ProductName')[0].value;
        var BuyerIp = $('#BuyerIp')[0].value = $window.returnCitySN["cip"];
        var SignType = $('#SignType')[0].value;
        var md5Key = 'shengfutongSHENGFUTONGtest';

        var sign_origin = Name+Version+Charset+MsgSender+OrderNo+OrderAmount+OrderTime+
            PayType+PayChannel+InstCode+PageUrl+BackUrl+NotifyUrl+ProductName+BuyerIp+SignType+md5Key;
        var SignMsg = SparkMD5.hash(sign_origin);
        SignMsg = SignMsg.toUpperCase();
        $('#SignMsg')[0].value = SignMsg;
        $('#shengPayForm')[0].submit();
    }

    vm.onlinePay = function() {
        if (!vm.pay_amount || vm.pay_amount < 0) {
            addAlert('danger', '请输入有效的充值金额');
            return;
        }
        vm.pay_amount = Number(vm.pay_amount.toFixed(2));
        if (!vm.pay_amount) {
            addAlert('danger', '最少充值1分钱');
            return;
        }

        if (vm.pay_order) {
            payThroughShengPay(vm.pay_order);
        } else {
            var newOrder = new njOrder({uid:vm.user._id});
            newOrder.userID = vm.user._id;
            newOrder.userMobile = vm.user.mobile;
            newOrder.dealType = 1;
            newOrder.amount = vm.pay_amount;
            newOrder.description = '网站充值';
            newOrder.$save(function(o, responseHeaders) {
                order_list.unshift(o);
                currentOrders = order_list;

                payThroughShengPay(o);
            }, function(response) {
                addAlert('danger', '服务暂时不可用，请稍后再试');
            });
        }
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