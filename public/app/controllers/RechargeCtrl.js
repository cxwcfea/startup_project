(function () {
    'use strict';
    angular.module('rechargeApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);
    angular.module('rechargeApp').controller('RechargeCtrl', ['$scope', '$window', '$location', 'njUser', 'njOrder', 'BankNameList', function ($scope, $window, $location, njUser, njOrder, BankNameList) {
        var vm = this;

        njUser.get({id: $window.bootstrappedNiujinUserID}, function (user) {
            vm.user = user;
            var query = $window.location.search;
            var pos1 = query.search('pay_order=');
            var order_id = null;
            if (pos1 > -1) {
                order_id = query.substr(pos1 + 10);
                var pos2 = order_id.search('&');
                if (pos2 > -1) {
                    order_id = order_id.substr(0, pos2);
                }
            }
            if (order_id) {
                vm.pay_order_id = order_id;
                vm.pay_order = njOrder.get({uid:vm.user._id, id:order_id}, function() {
                    vm.pay_amount = Number(vm.pay_order.amount.toFixed(2));
                    if (vm.pay_order.applySerialID) {
                        vm.pay_for_apply = true;
                    }
                });
            }
        });
        vm.currentPayType = 0;
        vm.useCredit = false;
        vm.BankNameList = BankNameList;
        vm.bankObj = vm.BankNameList[0];
        vm.payBank = 0;
        vm.alipayConfirm = false;

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

        vm.selectPayType = function (type) {
            vm.alerts = [];
            vm.alipayConfirm = false;
            vm.currentPayType = type.value;
        };

        vm.selectPayBank = function (bank) {
            vm.payBank = bank.value;
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
                    payThroughShengPay(o);
                }, function(response) {
                    addAlert('danger', '服务暂时不可用，请稍后再试');
                });
            }
        };

        vm.aliPay = function() {
            if (!vm.pay_amount || vm.pay_amount < 0) {
                addAlert('danger', '请输入有效的充值金额');
                return;
            }
            if (!vm.alipay_account) {
                addAlert('danger', '请输入支付宝账户');
                return;
            }
            vm.alipayConfirm = true;
            var newOrder = new njOrder({uid:vm.user._id});
            newOrder.userID = vm.user._id;
            newOrder.userMobile = vm.user.mobile;
            newOrder.dealType = 1;
            newOrder.amount = vm.pay_amount;
            newOrder.description = '支付宝转账';
            newOrder.payType = 3;
            newOrder.otherInfo = vm.alipay_account;
            newOrder.$save(function(o, responseHeaders) {
                console.log('order create success');
            }, function(response) {
                console.log('order create failed');
                addAlert('danger', '服务暂时不可用，请稍后再试');
            });
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

    }]);
}());