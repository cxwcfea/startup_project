'use strict';
angular.module('myApp').controller('UserPayController', ['gbIdentity', '$http', 'gbNotifier', '$location', 'gbOrder', function(gbIdentity, $http, gbNotifier, $location, gbOrder) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.submitRequest = function() {
        //console.log(vm.testValue + ' ' + vm.payAmount);
        if (!vm.payAmount || vm.payAmount <= 0) {
            gbNotifier.error('无效的充值金额');
            return;
        }
        var order = {
            userID: vm.user._id,
            dealType: '充值',
            amount: vm.payAmount,
            description: '10倍配资'
        };

        var newOrder = new gbOrder(order);
        newOrder.$save().then(function(response) {
            gbNotifier.notify('订单提交成功');
            if (response.order.status) {
                response.order.status = '交易成功';
            } else {
                response.order.status = '交易失败';
            }
            vm.user.orders.push(response.order);
        }, function(response) {
            gbNotifier.error('订单提交失败 ' + response.data.reason);
        });

        var balance = vm.user.finance.balance + vm.payAmount;
        $http.post('/api/users/' + vm.user._id, {finance:{balance:balance}})
            .then(function(response) {
                if (response.data.success) {
                    vm.user.finance.balance = balance;
                    gbNotifier.notify('充值成功');
                } else {
                    gbNotifier.error('充值失败:' + response.data.reason);
                }
            });
    };
}]);
