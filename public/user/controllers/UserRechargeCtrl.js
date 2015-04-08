'use strict';
angular.module('userApp').controller('UserRechargeCtrl', ['$scope', '$window', '$location', '$http', 'njUser', 'njOrder', 'BankNameList', function ($scope, $window, $location, $http, njUser, njOrder, BankNameList) {
    var vm = this;

    $scope.data.menu = 3;

    vm.user = $window.bootstrappedUserObject;

    vm.currentPayType = 0;
    vm.useCredit = false;
    vm.BankNameList = BankNameList;
    vm.BankNameLists = [];
    var tempList = [];
    for (var i = 0; i < BankNameList.length; ++i) {
        if (tempList.length === 3) {
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
    vm.smsSend = false;
    if (vm.user.lastPayBank >= 0) {
        vm.payBank = vm.user.lastPayBank;
    } else {
        vm.btnName = '收起列表';
        $(".jq_rec2_yhBox").toggleClass("rec2_yhBoxSelected");
        $(".jq_rec2_yhkList").slideToggle(200);
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
            vm.btnName = '收起列表';
        } else {
            vm.btnName = '更换银行';
        }
        $(".jq_rec2_yhkList").slideToggle(200);
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

    vm.gotoPay = function() {
        if (vm.payBank === -1) {
            addAlert('danger', '请先选择付款银行');
            return;
        }
        vm.showPayConfirm = true;
    };

    vm.onlinePay = function() {
        if (vm.payBank === -1) {
            addAlert('danger', '请先选择付款银行');
            return;
        }
        if (!vm.pay_amount || vm.pay_amount < 0) {
            addAlert('danger', '请输入有效的充值金额');
            return;
        }
        vm.pay_amount = Number(vm.pay_amount.toFixed(2));
        if (!vm.pay_amount) {
            addAlert('danger', '最少充值1分钱');
            return;
        }

        vm.pay_amount = Number(vm.pay_amount.toFixed(2));

        var newOrder = new njOrder({uid:vm.user._id});
        newOrder.userID = vm.user._id;
        newOrder.userMobile = vm.user.mobile;
        newOrder.dealType = 1;
        newOrder.amount = vm.pay_amount;
        newOrder.description = '网站充值';
        newOrder.$save(function(o, responseHeaders) {
            vm.paying = true;
            payThroughShengPay(o);
        }, function(response) {
            addAlert('danger', '服务暂时不可用，请稍后再试');
        });
    };

    vm.closeOtherWindow = function () {
        vm.smsSend = false;
        vm.showAlipayWindow = false;
        vm.showBankTransWindow = false;
        vm.alipayConfirm = false;
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
        if (!vm.pay_amount || vm.pay_amount < 0) {
            addAlert('danger', '请输入有效的充值金额');
            return;
        }
        if (!vm.alipay_account) {
            addAlert('danger', '请输入支付宝账户');
            return;
        }
        if (!vm.alipay_name) {
            addAlert('danger', '请输入支付宝实名认证姓名');
            return;
        }
        vm.alipayConfirm = true;

        var newOrder = new njOrder({uid:vm.user._id});
        newOrder.userID = vm.user._id;
        newOrder.userMobile = vm.user.mobile;
        newOrder.dealType = 1;
        newOrder.amount = Number(vm.pay_amount.toFixed(2));
        newOrder.description = '支付宝转账';
        newOrder.payType = 3;
        newOrder.status = 2;
        newOrder.otherInfo = vm.alipay_account;
        newOrder.transID = vm.alipay_name;
        newOrder.$save(function(o, responseHeaders) {
            console.log('order create success');
        }, function(response) {
            console.log('order create failed');
            addAlert('danger', '服务暂时不可用，请稍后再试');
        });
    };

}]);