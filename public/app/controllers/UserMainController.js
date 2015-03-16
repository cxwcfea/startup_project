'use strict';
angular.module('myApp').controller('UserMainController', ['gbIdentity', function(gbIdentity) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.user_total_capital = (vm.user.finance.balance + vm.user.finance.deposit + vm.user.finance.freeze_capital).toFixed(2);

    vm.displayName = function() {
        if (vm.user.profile.name) {
            return vm.user.profile.name;
        }
        return vm.user.mobile;
    };

    vm.registerDate = function() {
        return moment(vm.user.registerAt).format('ll');
    }

}]);
