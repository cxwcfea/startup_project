'use strict';
angular.module('userApp').controller('UserPromoteCtrl', ['$scope', '$window', '$http', '$timeout', function($scope, $window, $http, $timeout) {
    var vm = this;

    $scope.data.menu = 5;

    vm.user = $scope.data.currentUser;

    vm.total_fee = vm.user.finance.history_commission ? vm.user.finance.history_commission / 0.07 : 0;
    vm.paid_fee = vm.user.finance.history_commission ? vm.user.finance.history_commission - vm.user.finance.commission : 0;
    vm.transAmount = vm.user.finance.commission ? Math.floor(vm.user.finance.commission / 100) * 100 : 0;

    vm.showItem = 1;
    vm.showTransMoneyWindow = false;
    $window._bd_share_config.common.bdText += ' http://www.niujinwang.com/?refer=' + vm.user.referName;
    $window._bd_share_config.common.bdDesc += ' http://www.niujinwang.com/?refer=' + vm.user.referName;
    $window._bd_share_config.common.bdUrl = 'http://www.niujinwang.com/?refer=' + vm.user.referName;

    $http.get('/user/api/refer_user_list')
        .success(function(data, status) {
            vm.myUserList = data;
            vm.totalApplyAmount = 0;
            if (data.length > 0) {
                vm.myPayUsers = data.filter(function(elem) {
                    return elem.finance.history_deposit > 100;
                });
                vm.myPayUsers.forEach(function(elem) {
                    vm.totalApplyAmount += elem.finance.history_capital;
                });
            } else {
                vm.myPayUsers = [];
            }
        })
        .error(function(data, status) {
            vm.myUserList = [];
        });

    vm.viewSoure = function() {
        if (vm.showItem === 1) {
            return '/views/promote_detail.html';
        } else {
            return '/views/my_user_list.html';
        }
    };

    vm.viewLoad = function() {
        $timeout(function() {
            $("#J_copy").zclip({
                path: "/images/ZeroClipboard.swf",
                copy: function () {
                    return $("#J_link").text();
                },
                afterCopy: function() {
                    alert('您的推广链接已经复制到剪贴板\nhttp://www.niujinwang.com/?refer=' + vm.user.referName);
                }
            });
        }, 500);
    };

    vm.transMoney = function() {
        vm.showTransMoneyWindow = true;
    };

    vm.closePopupWindow = function() {
        vm.showTransMoneyWindow = false;
        vm.transFail = false;
        vm.transSuccess = false;
    };

    vm.completeTransMoney = function() {
        if (vm.transAmount <= 0) {
            vm.failReason = '可兑换金额不足';
            vm.transFail = true;
            return;
        }
        $http.post('/user/api/transfer_commission', {amount:vm.transAmount})
            .success(function (data, status) {
                vm.transSuccess = true;
                vm.user.finance.balance += vm.transAmount;
                vm.user.finance.commission -= vm.transAmount;
                vm.paid_fee += vm.transAmount;
            })
            .error(function (data, status) {
                vm.failReason = data.error_msg;
                vm.transFail = true;
            });
    };
}]);
