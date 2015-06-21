'use strict';
angular.module('mobileApp').controller('MobileRechargeCtrl', ['$scope', '$window', '$http', '$timeout', '$location', 'njOrder', function($scope, $window, $http, $timeout, $location, njOrder) {
    var vm = this;

    var beifuData;
    vm.bankList = [
        {
            name: '中国工商银行',
            code: 'ICBC_D_B2C',
            yeepayCode: 'ICBC',
            value: 0
        },
        {
            name: '中国农业银行',
            code: 'ABC_D_B2C',
            value: 1
        },
        {
            name: '中国建设银行',
            code: 'CCB_D_B2C',
            yeepayCode: 'CCB',
            value: 2
        },
        {
            name: '民生银行',
            code: 'CMBCD_D_B2C',
            value: 3
        },
        {
            name: '中国银行',
            code: 'BOCSH_D_B2C',
            yeepayCode: 'BOC',
            value: 4
        },
        {
            name: '招商银行',
            code: 'CMB_D_B2C',
            value: 5
        },
        {
            name: '兴业银行',
            code: 'CIB_D_B2C',
            value: 6
        },
        {
            name: '光大银行',
            code: 'CEB_D_B2C',
            value: 7
        },
        {
            name: '广发银行',
            code: 'GDB_D_B2C',
            value: 8
        }
    ];
    vm.user_bank = vm.bankList[0];
    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {}
        }
        $scope.data.lastLocation = '/user';
        $location.path('/login');
    } else {
        vm.smsSend = false;
        vm.inputError = false;
        vm.alipayConfirm = false;
        vm.orderCreateSuccess = false;
        vm.showVerifyCodeWindow = false;
        vm.finishOnlinePayWindow = false;
        vm.processing = false;
        vm.pay_order = $window.bootstrappedOrderObject;
        vm.fee = 0;
        vm.total_fee = 0;
        if (vm.pay_order) {
            if (vm.user.finance.balance > 0) {
                vm.pay_amount = Number((vm.pay_order.amount - vm.user.finance.balance).toFixed(2));
                if (vm.pay_amount < 0) {
                    vm.pay_amount = 0;
                }
            } else {
                vm.pay_amount = Number(vm.pay_order.amount.toFixed(2));
            }
            calculatePayAmount();
        }
        vm.alipayAccountConfirm = false;
        if (vm.user.profile.alipay_account) {
            vm.alipayAccountConfirm = true;
            vm.alipay_account = vm.user.profile.alipay_account;
            vm.alipay_name = vm.user.profile.alipay_name;
        }

        if ($scope.data.intendedRechargeAmount) {
            vm.pay_amount = $scope.data.intendedRechargeAmount;
        }
    }

    function calculatePayAmount() {
        if (vm.pay_amount) {
            /*
            vm.fee = vm.pay_amount * 0.0035;
            if (vm.fee < 2.0) {
                vm.fee = 2.0;
            }
            vm.fee = Number(vm.fee.toFixed(2));
            */
            vm.fee = 0;
            vm.total_fee = vm.fee + vm.pay_amount;
            vm.total_fee = Number(vm.total_fee.toFixed(2));
        } else {
            vm.fee = 0;
            vm.total_fee = 0;
        }
    }

    vm.sendSMSBankInfo = function() {
        if (vm.smsSend) {
            return;
        }
        vm.smsSend = true;
        $timeout(function() {
            vm.smsSend = false;
        }, 60000);
        var info = '户名：北京小牛普惠科技有限公司，账号：110912609510501，开户行：招商银行股份有限公司北京清华园支行';
        $http.post('/api/send_sms', {sms_content:info})
            .success(function(data, status, headers, config) {
                //addAlert('success', '短信发送成功');
                console.log('success');
            })
            .error(function(data, status, headers, config) {
                //addAlert('danger', '短信发送失败，请稍后重试');
                console.log('fail');
            });
    };

    vm.aliPay = function() {
        if (!vm.alipay_account) {
            vm.errorMsg = '请输入支付宝账户';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.alipay_name) {
            vm.errorMsg = '请输入支付宝实名认证姓名';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.pay_amount || vm.pay_amount < 0) {
            vm.errorMsg = '请输入有效的充值金额';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        vm.alipayConfirm = true;

        var newOrder = new njOrder({uid:vm.user._id});
        if (vm.pay_order) {
            vm.pay_order.description += ' 支付宝转账(移动)';
            vm.pay_order.amount = vm.pay_amount;
            vm.pay_order.payType = 3;
            vm.pay_order.otherInfo = vm.alipay_account.trim().toLowerCase();
            vm.pay_order.transID = vm.alipay_name.trim().toLowerCase();
            $http.post('/api/user/' + vm.user._id + '/orders/' + vm.pay_order._id, vm.pay_order)
                .success(function(data, status) {
                })
                .error(function(data, status) {
                    console.log('order update failed');
                    vm.errorMsg = '服务暂时不可用，请稍后再试';
                    vm.inputError = true;
                    $timeout(function() {
                        vm.inputError = false;
                    }, 1500);
                });
        } else {
            newOrder.userID = vm.user._id;
            newOrder.userMobile = vm.user.mobile;
            newOrder.dealType = 1;
            newOrder.amount = Number(vm.pay_amount.toFixed(2));
            newOrder.description = '支付宝转账(移动)';
            newOrder.payType = 3;
            newOrder.status = 2;
            newOrder.otherInfo = vm.alipay_account.trim().toLowerCase();
            newOrder.transID = vm.alipay_name.trim().toLowerCase();
            newOrder.$save(function(o, responseHeaders) {
            }, function(response) {
                vm.errorMsg = '服务暂时不可用，请稍后再试';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
            });
        }
    };

    vm.onlinePayStepOneForFirstTime = function() {
        if (vm.processing) {
            return;
        }
        if (!vm.pay_amount || vm.pay_amount <= 2) {
            vm.errorMsg = '请输入有效的充值金额,2.01元~100元';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.user_name) {
            vm.errorMsg = '请输入姓名';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.user_id) {
            vm.errorMsg = '请输入身份证号';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.user_bank) {
            vm.errorMsg = '请选择银行';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        var regex = /^(\d{12}|\d{16}|\d{17}|\d{18}|\d{19})$/;
        if (!regex.test(vm.user_bank_card_id)) {
            vm.errorMsg = '请输入银行卡号';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.user_mobile) {
            vm.errorMsg = '请输入银行预留手机号';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        var data = {
            amount: vm.pay_amount,
            //total_fee: vm.total_fee,
            real_name: vm.user_name,
            cert_no: vm.user_id,
            bank_code: vm.user_bank.code,
            card_no: vm.user_bank_card_id,
            card_bind_mobile_phone_no: vm.user_mobile
        };
        if (vm.pay_order) {
            data.out_trade_no = vm.pay_order._id;
        }
        beifuData = data;
        vm.processing = true;
        $http.post('/user/beifu_get_dyncode', data)
            .success(function(data, status) {
                vm.processing = false;
                vm.showVerifyCodeWindow = true;
                beifuData.token = data.token;
                beifuData.out_trade_no = data.order_id;
            })
            .error(function(data, status) {
                vm.processing = false;
                vm.errorMsg = data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
            });
    };

    vm.onlinePayStepOne = function() {
        if (vm.processing) {
            return;
        }
        if (!vm.pay_amount || vm.pay_amount <= 2) {
            vm.errorMsg = '请输入有效的充值金额，高于2元';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 2500);
            return;
        }
        var data = {
            amount: vm.pay_amount,
            //total_fee: vm.total_fee,
            firstPay: false
        };
        if (vm.pay_order) {
            data.out_trade_no = vm.pay_order._id;
        }
        beifuData = data;
        vm.processing = true;
        $http.post('/user/beifu_get_dyncode', data)
            .success(function(data, status) {
                vm.processing = false;
                vm.showVerifyCodeWindow = true;
                beifuData.token = data.token;
                beifuData.out_trade_no = data.order_id;
            })
            .error(function(data, status) {
                vm.processing = false;
                vm.errorMsg = data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
            });
    };

    vm.onlinePayStepTwo = function() {
        if (!vm.verify_code) {
            vm.errorMsg = '请输入验证码';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        beifuData.exter_invoke_ip = $window.returnCitySN["cip"];
        beifuData.verify_code = vm.verify_code;
        vm.processing = true;
        $http.post('/user/beifu_pay', beifuData)
            .success(function(data, status) {
                vm.processing = false;
                vm.showVerifyCodeWindow = false;
                vm.finishOnlinePayWindow = true;
            })
            .error(function(data, status) {
                vm.processing = false;
                vm.errorMsg = data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
            });
    };

    vm.confirmAlipay = function() {
        vm.orderCreateSuccess = true;
    };

    vm.finish = function() {
        $location.path('/recharge');
    };

    vm.useBankTransPay = function() {
        $location.path('/recharge_bank');
    };

    vm.selectBank = function() {
        console.log(vm.user_bank.name);
    };

    vm.gotoApply = function() {
        $location.path('/ttn');
    };

    vm.inputPayAmount = function() {
        calculatePayAmount();
    };

    vm.yeepayBindCard = function() {
        if (vm.processing) {
            return;
        }
        if (!vm.user_name) {
            vm.errorMsg = '请输入姓名';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.user_id) {
            vm.errorMsg = '请输入身份证号';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.user_bank) {
            vm.errorMsg = '请选择银行';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        var regex = /^(\d{12}|\d{16}|\d{17}|\d{18}|\d{19})$/;
        if (!regex.test(vm.user_bank_card_id)) {
            vm.errorMsg = '请输入银行卡号';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        if (!vm.user_mobile) {
            vm.errorMsg = '请输入银行预留手机号';
            vm.inputError = true;
            $timeout(function() {
                vm.inputError = false;
            }, 1500);
            return;
        }
        var dataObj = {
            real_name: vm.user_name,
            cert_no: vm.user_id,
            bank_code: vm.user_bank.code,
            card_no: vm.user_bank_card_id,
            card_bind_mobile_phone_no: vm.user_mobile,
            user_ip: $window.returnCitySN["cip"]
        };
        vm.processing = true;
        $http.post('/api/yeepay_bind_card', dataObj)
            .success(function(data, status) {
                vm.processing = false;
            })
            .error(function(data, status) {
                vm.processing = false;
                vm.errorMsg = data.error_msg;
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 2000);
            });
    };
}]);