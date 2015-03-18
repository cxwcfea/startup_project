'use strict';
angular.module('myApp').controller('UserEmailController', ['gbIdentity', '$http', 'gbNotifier', '$location', function(gbIdentity, $http, gbNotifier, $location) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.verifyEmail = function() {
        console.log('verify email');
        $http.post('/user/verify_email', {email:vm.user.profile.email})
            .then(function(response) {
                if (response.data.success) {
                    gbNotifier.notify('验证邮件已成功发送');
                } else {
                    gbNotifier.error('邮件发送失败,请稍后再试');
                }
            });
    };
}]);
