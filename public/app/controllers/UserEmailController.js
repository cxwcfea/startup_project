'use strict';
angular.module('myApp').controller('UserEmailController', ['gbIdentity', '$http', 'gbNotifier', '$location', function(gbIdentity, $http, gbNotifier, $location) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.verifyEmail = function() {
        console.log('verify email');
        $http.post('/user/verify_email', {email:vm.user.profile.email})
            .then(function(response) {
                if (response.data.success) {
                    gbNotifier.notify('email send success');
                } else {
                    gbNotifier.error('email send fail ' + response.data.reason);
                }
            });
    };
}]);
