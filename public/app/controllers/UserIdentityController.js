'use strict';
angular.module('myApp').controller('UserIdentityController', ['gbIdentity', '$http', 'gbNotifier', '$location', function(gbIdentity, $http, gbNotifier, $location) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.submitRequest = function() {
        $http.post('/api/users/' + vm.user._id, {identity:vm.user.identity})
            .then(function(response) {
                if (response.data.success) {
                    gbNotifier.notify('实名认证成功');
                    $location.path('/user/security');
                } else {
                    gbNotifier.error('实名认证失败');
                }
            });
    };
}]);
