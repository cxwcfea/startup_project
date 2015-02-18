'use strict';
angular.module('myApp').controller('UserProfileController', ['gbIdentity', 'gbNotifier', '$http', function(gbIdentity, gbNotifier, $http) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.updateUserProfile = function() {
        $http.post('/api/users/' + vm.user._id, {profile:vm.user.profile})
            .then(function(response) {
                if (response.data.success) {
                    gbNotifier.notify('个人信息更新成功');
                } else {
                    gbNotifier.error('个人信息更新失败');
                }
            });
    };
}]);
