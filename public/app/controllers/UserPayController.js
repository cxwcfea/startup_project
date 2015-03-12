'use strict';
angular.module('myApp').controller('UserPayController', ['gbIdentity', '$http', 'gbNotifier', '$window', 'gbOrder', function(gbIdentity, $http, gbNotifier, $window, gbOrder) {
    var vm = this;
    vm.user = gbIdentity.currentUser;
    vm.pay_option = 'option1';

    vm.gotoPay = function() {
        if (!vm.payAmount || vm.payAmount < 0) {
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
            var value = 1;
            if (vm.pay_option === 'option2') {
                value = 2;
            }
            $window.location.assign('/pay_confirm/' + newOrder._id + '?pay_option=' + value);
        }, function(response) {
            gbNotifier.error('订单提交失败 ' + response.data.reason);
        });
    };
}]);
