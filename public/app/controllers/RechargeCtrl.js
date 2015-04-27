(function () {
    'use strict';
    angular.module('rechargeApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

    angular.module('rechargeApp').config(['$httpProvider', function($httpProvider) {
        // Initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        // Disable IE ajax request caching
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
    }]);

    angular.module('rechargeApp').controller('RechargeCtrl', ['$scope', '$window', '$location', '$http', 'njUser', 'njOrder', 'BankNameList', function ($scope, $window, $location, $http, njUser, njOrder, BankNameList) {
        var vm = this;

        vm.user = $window.bootstrappedUserObject;
        vm.pay_order = $window.bootstrappedOrderObject;

        vm.currentPayType = 0;
        vm.useCredit = false;
        vm.BankNameList = BankNameList;
        vm.useBalance = false;
        if (vm.user.finance.balance > 0) {
            vm.useBalance = true;
            calculatePayAmount();
        }
        vm.BankNameLists = [];
        var tempList = [];
        for (var i = 0; i < BankNameList.length; ++i) {
            if (tempList.length === 4) {
                vm.BankNameLists.push(tempList);
                tempList = [];
            }
            tempList.push(BankNameList[i]);
        }
        if (tempList.length > 0) {
            vm.BankNameLists.push(tempList);
        }

        vm.btnName = '更换银行';
        vm.showAlipayWindow = false;
        vm.showPayConfirm = false;
        vm.showBankTransWindow = false;
        vm.paying = false;
        vm.bankObj = vm.BankNameList[0];
        vm.payBank = -1;
        vm.alipayConfirm = false;
        vm.bankTransConfirm = false;
        if (vm.user.lastPayBank >= 0) {
            vm.payBank = vm.user.lastPayBank;
        } else {
            vm.btnName = '收起';
            $(".jq_rec2_yhBox").toggleClass("rec2_yhBoxSelected");
            $(".jq_rec2_yhkList").slideToggle(200);
        }
        vm.smsSend = false;
        vm.alipayAccountConfirm = false;
        if (vm.user.profile.alipay_account) {
            vm.alipayAccountConfirm = true;
            vm.alipay_account = vm.user.profile.alipay_account;
            vm.alipay_name = vm.user.profile.alipay_name;
        }

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

        calculatePayAmount();

        var addAlert = function(type, msg) {
            vm.alerts = [];
            vm.alerts.push({type:type, msg: msg});
        };

        vm.closeAlert = function(index) {
            vm.alerts.splice(index, 1);
        };

        vm.selectPayType = function (type) {
            vm.alerts = [];
            vm.alipayConfirm = false;
            vm.currentPayType = type;
            if (vm.currentPayType === 2) {
                vm.showBankTransWindow = true;
            }
            if (vm.currentPayType === 1) {
                vm.showAlipayWindow = true;
            }
        };

        vm.selectPayBank = function (bank) {
            vm.payBank = bank.value;
            $(".jq_rec2_yhBox").toggleClass("rec2_yhBoxSelected");
            $(".jq_rec2_yhkList").slideToggle(200);
            vm.btnName = '更换银行';
        };

        vm.changeBtnName = function() {
            if (vm.btnName === '更换银行') {
                vm.btnName = '收起';
            } else {
                vm.btnName = '更换银行';
            }
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

        vm.sendSMSBankInfo = function() {
            addAlert('success', '信息已发送，请勿重复点击');
            if (vm.smsSend) {
                return;
            }
            vm.smsSend = true;

            var info = '户名：北京小牛普惠科技有限公司，账号：110912609510501，开户行：招商银行股份有限公司北京清华园支行';
            $http.post('/api/send_sms', {sms_content:info})
                .success(function(data, status, headers, config) {
                    addAlert('success', '短信发送成功');
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', '短信发送失败，请稍后重试');
                });
        };

        vm.balanceChecked = function() {
            calculatePayAmount();
        };

        vm.gotoPay = function() {
            if (vm.payBank === -1) {
                addAlert('danger', '请先选择付款银行');
                return;
            }
            vm.showPayConfirm = true;
        };

        vm.onlinePay = function() {
            vm.pay_amount = Number(vm.pay_amount.toFixed(2));
            vm.pay_order.amount = vm.pay_amount;

            vm.paying = true;
            $http.post('/api/user/' + vm.user._id + '/orders/' + vm.pay_order._id, vm.pay_order)
                .success(function(data, status) {
                    console.log('order update success');
                    payThroughShengPay(vm.pay_order);
                })
                .error(function(data, status) {
                    console.log('order update failed');
                    addAlert('danger', '服务暂时不可用，请稍后再试');
                });
        };

        vm.closeOtherWindow = function () {
            vm.smsSend = false;
            vm.showAlipayWindow = false;
            vm.showBankTransWindow = false;
            vm.alipayConfirm = false;
            vm.bankTransConfirm = false;
            vm.alerts = [];
        };

        function payThroughShengPay(order) {
            vm.user.lastPayBank = vm.payBank;

            $http.post('/api/user/' + vm.user._id, vm.user)
                .success(function(data, status) {
                    vm.user = data;
                    console.log('lastPayBank updated');
                })
                .error(function(data, status) {
                    console.log('lastPayBank update failed');
                });

            var OrderNo = $('#OrderNo')[0].value = order._id;
            var OrderAmount = $('#OrderAmount')[0].value = order.amount.toFixed(2);
            var InstCode = $('#InstCode')[0].value = BankNameList[vm.payBank].instCode;
            var BuyerIp = $('#BuyerIp')[0].value = $window.returnCitySN["cip"];

            $('#shengPayForm')[0].submit();
        }

        vm.aliPay = function() {
            if (!vm.alipay_account) {
                addAlert('danger', '请输入支付宝账户');
                return;
            }
            if (!vm.alipay_name) {
                addAlert('danger', '请输入支付宝实名认证姓名');
                return;
            }
            vm.alipayConfirm = true;

            vm.pay_amount = Number(vm.pay_amount.toFixed(2));
            vm.pay_order.amount = vm.pay_amount;
            vm.pay_order.payType = 3;
            vm.pay_order.otherInfo = vm.alipay_account.trim().toLowerCase();
            vm.pay_order.transID = vm.alipay_name.trim().toLowerCase();
            $http.post('/api/user/' + vm.user._id + '/orders/' + vm.pay_order._id, vm.pay_order)
                .success(function(data, status) {
                    console.log('order update success');
                })
                .error(function(data, status) {
                    vm.alipayConfirm = false;
                    if (response.status === 403) {
                        addAlert('danger', response.data);
                    } else {
                        console.log('order update failed');
                        addAlert('danger', '服务暂时不可用，请稍后再试');
                    }
                });
        };

        vm.bankTransNext = function() {
            vm.bankTransConfirm = true;
        };

        function calculatePayAmount() {
            vm.pay_amount = vm.pay_order.amount;
            if (vm.useBalance) {
                vm.pay_amount -= vm.user.finance.balance;
            }
        }
    }]);
}());