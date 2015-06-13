'use strict';
angular.module('mobileApp').controller('MobileWithdrawCtrl', ['$scope', '$http', '$window', '$location', '$routeParams', '$filter', 'njOrder', 'njCard', 'BankNameList', '$timeout', function($scope, $http, $window, $location, $routeParams, $filter, njOrder, njCard, BankNameList, $timeout) {
    var vm = this;

    vm.step = 0;
    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {}
        }
        $scope.data.lastLocation = '/user';
        $location.path('/login');
    } else {
        var cards = njCard.query({uid:vm.user._id}, function() {
            vm.tips = '提现银行卡为您绑定的提现银行卡';
            if (cards.length > 0) {
                vm.card = cards.pop();
                vm.card.nameOfTheBank = BankNameList[vm.card.bankID].name;
                vm.step = 1;
                if (vm.card.type === 2) {
                    vm.tips = '提现银行卡绑定为您支付时使用的银行卡';
                }
            }
        });

        vm.BankNameList = BankNameList;
        vm.bankObj = vm.BankNameList[0];
    }

    vm.selectCard = function(card) {
        vm.selectedCard = card;
    };

    vm.getAll = function() {
        vm.withdrawAmount = Number(vm.user.finance.balance.toFixed(2));
    };

    vm.withdrawNextStep = function() {
        if (vm.step === 1) {
            if (!vm.withdrawAmount || vm.withdrawAmount <= 0) {
                vm.errorMsg = '请输入提现金额,金额不超过余额且大于0';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }
            vm.withdrawAmount = Number(vm.withdrawAmount.toFixed(2));
            var balance = Number(vm.user.finance.balance.toFixed(2));
            if (vm.withdrawAmount > balance) {
                vm.errorMsg = '余额不足!';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }
            vm.step = 2;
        } else if (vm.step === 2) {
            var orderData= {
                amount: vm.withdrawAmount,
                description: '余额提现',
                cardInfo: {
                    bank: BankNameList[vm.card.bankID].name,
                    bankName: vm.card.bankName,
                    cardID: vm.card.cardID,
                    province: vm.card.province,
                    city: vm.card.city,
                    userName: vm.card.userName
                }
            };

            $http.post('/user/withdraw', orderData)
                .success(function(data, status, headers, config) {
                    vm.user.finance.freeze_capital += orderData.amount;
                    vm.user.finance.balance -= orderData.amount;
                    vm.step = 3;
                })
                .error(function(data, status, headers, config) {
                    vm.errorMsg = '提现申请提交失败,请联系客服! ' + data.error_msg;
                    vm.inputError = true;
                    $timeout(function() {
                        vm.inputError = false;
                    }, 2500);
                });
        }
    };

}]);
