'use strict';
angular.module('mobileApp').controller('MobileInvestCtrl', ['$scope', '$window', '$timeout', '$http', '$location', function($scope, $window, $timeout, $http, $location) {
    var vm = this;

    vm.user = $window.bootstrappedUserObject;
    if (!vm.user) {
        if (!$scope.data) {
            $scope.data = {}
        }
        $scope.data.lastLocation = '/invest';
        $location.path('/login');
    } else {
        vm.inputError = false;
        vm.editInvest = true;
        vm.showRateDialog = false;
        if (vm.user.enableInvest === undefined || vm.user.enableInvest === null) {
            vm.editInvest = false;
        } else {
            $http.get('/api/user/invest_info')
                .success(function(data, status) {
                    vm.profit_rate = data.investor.profitRate;
                    vm.period = data.investor.duration;
                })
                .error(function(data, status) {
                    vm.investor = {};
                    console.log(data.error_msg);
                });
        }

        vm.changeInvest = function() {
            var data = {
                profitRate: vm.profit_rate,
                duration: vm.period,
                enable: true
            };
            $http.post('/api/user/invest_update', data)
                .success(function(data, status) {
                    vm.success = true;
                    $timeout(function() {
                        vm.success = false;
                    }, 1500);
                })
                .error(function(data, status) {
                    vm.errorMsg = data.error_msg;
                    vm.inputError = true;
                    $timeout(function() {
                        vm.inputError = false;
                    }, 1500);
                });
        };

        vm.startInvest = function() {
            if (!vm.profit_rate) {
                vm.errorMsg = '请输入期望收益率，0到18之间';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }
            if (!vm.period) {
                vm.errorMsg = '请输入期望项目借款期限，1到30之间';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }

            var data = {
                profitRate: vm.profit_rate,
                duration: vm.period,
                enable: true
            };
            $http.post('/api/user/invest_update', data)
                .success(function(data, status) {
                    vm.showConfirmDialog = true;
                })
                .error(function(data, status) {
                    vm.errorMsg = data.error_msg;
                    vm.inputError = true;
                    $timeout(function() {
                        vm.inputError = false;
                    }, 1500);
                });
            /*
            if (!vm.amount) {
                vm.errorMsg = '请输入预投资本金，最少100元';
                vm.inputError = true;
                $timeout(function() {
                    vm.inputError = false;
                }, 1500);
                return;
            }
            if (vm.user.finance.balance < vm.amount) {
            }
            */
        };

        vm.closeDialogWindow = function() {
            vm.showRateDialog = false;
            vm.showConfirmDialog = false;
        };

        vm.confirmInvest = function() {
            vm.editInvest = true;
            vm.closeDialogWindow();
        };

        vm.rechargeToInvestAccount = function() {
            console.log('rechargeToInvestAccount');
        }
    }
}]);