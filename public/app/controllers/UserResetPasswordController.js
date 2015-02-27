'use strict';
angular.module('myApp').controller('UserResetPasswordController', ['gbIdentity', '$http', 'gbNotifier', '$location', function(gbIdentity, $http, gbNotifier, $location) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.submitRequest = function() {
        if (vm.new_pass !== vm.confirm_pass) {
            gbNotifier.error('两次输入的密码不同');
            return;
        }
        $http.post('/user/change_pass', {old_password:vm.old_pass, password:vm.new_pass, confirm_password:vm.confirm_pass})
            .then(function(response) {
                if (response.data.success) {
                    gbNotifier.notify('密码设置成功');
                    $location.path('/user/security');
                } else {
                    gbNotifier.error('密码设置失败：' + response.data.reason);
                }
            });
    };
}]);
