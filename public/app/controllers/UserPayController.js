'use strict';
angular.module('myApp').controller('UserPayController', ['gbIdentity', '$http', 'gbNotifier', '$window', 'gbOrder', function(gbIdentity, $http, gbNotifier, $window, gbOrder) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.gotoPay = function() {
        if (!vm.payAmount || vm.payAmount < 1) {
            gbNotifier.error('无效的充值金额');
            return;
        }
        var order = {
            userID: vm.user._id,
            dealType: '充值',
            amount: vm.payAmount,
            description: '网站充值'
        };

        var newOrder = new gbOrder(order);
        newOrder.$save().then(function(data) {
            gbNotifier.notify('订单提交成功');
            $window.location.assign('/pay_confirm/' + newOrder._id);
            /*
            if (response.order.status) {
                response.order.status = '交易成功';
            } else {
                response.order.status = '交易失败';
            }
            vm.user.orders.push(response.order);
            var data = {
                id: response.order._id,
                price: vm.payAmount,
                uid: vm.user._id
            };
            $http.post('/api/user_pay', data)
                .then(function(response) {
                    if (response.data.success) {
                        gbNotifier.notify('ok');
                    } else {
                        gbNotifier.error('fail');
                    }
                });
                */
        }, function(response) {
            gbNotifier.error('订单提交失败 ' + response.data.reason);
        });

        /*
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
            */
    };
}]);
