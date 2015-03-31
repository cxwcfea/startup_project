(function () {
    'use strict';
    angular.module('rechargeApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);
    angular.module('rechargeApp').controller('RechargeCtrl', ['$scope', '$window', '$location', '$http', 'njUser', 'njOrder', 'BankNameList', function ($scope, $window, $location, $http, njUser, njOrder, BankNameList) {
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
            vm.alerts = [];
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
            if (!vm.alipay_name) {
                addAlert('danger', '请输入支付宝实名认证姓名');
                return;
            }
            vm.alipayConfirm = true;
            if (vm.pay_order) {
                vm.pay_order.payType = 3;
                vm.pay_order.otherInfo = vm.alipay_account;
                vm.pay_order.transID = vm.alipay_name;
                vm.pay_order.$save(function(o, responseHeaders) {
                    console.log('order update success');
                }, function(response) {
                    console.log('order update failed');
                    addAlert('danger', '服务暂时不可用，请稍后再试');
                });
            } else {
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
            }
        };

        vm.sendSMSBandInfo = function() {
            var info = '户名：北京小牛普惠科技有限公司，账号：110912609510501，开户行：招商银行股份有限公司北京清华园支行';
            $http.post('/api/send_sms', {sms_content:info})
                .success(function(data, status, headers, config) {
                    addAlert('success', '短信发送成功');
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', '短信发送失败，请稍后重试');
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
            var md5Key = 'JDJhJDA1JHpMRVc3UkJLR202R2hhNHZzZllMYi5';

            var sign_origin = Name+Version+Charset+MsgSender+OrderNo+OrderAmount+OrderTime+
                PayType+PayChannel+InstCode+PageUrl+BackUrl+NotifyUrl+ProductName+BuyerIp+SignType+md5Key;
            var SignMsg = SparkMD5.hash(sign_origin);
            SignMsg = SignMsg.toUpperCase();
            $('#SignMsg')[0].value = SignMsg;
            $('#shengPayForm')[0].submit();
        }

    }]);

    angular.module('rechargeApp').controller('RechargeCtrl2', ['$scope', '$window', '$location', '$http', 'njUser', 'njOrder', 'BankNameList', function ($scope, $window, $location, $http, njUser, njOrder, BankNameList) {
        var vm = this;

        vm.user = $window.bootstrappedUserObject;
        vm.pay_order = $window.bootstrappedOrderObject;

        vm.currentPayType = 0;
        vm.useCredit = false;
        vm.BankNameList = BankNameList;
        vm.useBalance = false;
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
        vm.showNextBtn = true;
        vm.paying = false;
        vm.bankObj = vm.BankNameList[0];
        vm.payBank = -1;
        vm.alipayConfirm = false;
        if (vm.user.lastPayBank >= 0) {
            vm.payBank = vm.user.lastPayBank;
        } else {
            vm.btnName = '收起';
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
                vm.showNextBtn = false;
            } else {
                vm.showNextBtn = true;
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
            if (vm.currentPayType === 0) {
                if (vm.payBank === -1) {
                    addAlert('danger', '请先选择付款银行');
                    return;
                }
                vm.showPayConfirm = true;
            } else if (vm.currentPayType === 1) {
                aliPay();
            }
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
            var md5Key = 'JDJhJDA1JHpMRVc3UkJLR202R2hhNHZzZllMYi5';

            var sign_origin = Name+Version+Charset+MsgSender+OrderNo+OrderAmount+OrderTime+
                PayType+PayChannel+InstCode+PageUrl+BackUrl+NotifyUrl+ProductName+BuyerIp+SignType+md5Key;
            var SignMsg = SparkMD5.hash(sign_origin);
            SignMsg = SignMsg.toUpperCase();
            $('#SignMsg')[0].value = SignMsg;
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
            vm.pay_order.otherInfo = vm.alipay_account;
            vm.pay_order.transID = vm.alipay_name;
            $http.post('/api/user/' + vm.user._id + '/orders/' + vm.pay_order._id, vm.pay_order)
                .success(function(data, status) {
                    console.log('order update success');
                })
                .error(function(data, status) {
                    console.log('order update failed');
                    addAlert('danger', '服务暂时不可用，请稍后再试');
                });
        }

        function calculatePayAmount() {
            vm.pay_amount = vm.pay_order.amount;
            if (vm.useBalance) {
                vm.pay_amount -= vm.user.finance.balance;
            }
        }

    }]);
}());