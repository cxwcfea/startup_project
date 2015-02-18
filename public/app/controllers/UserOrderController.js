'use strict';
angular.module('myApp').controller('UserOrderController', ['gbIdentity', function(gbIdentity) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    vm.formatDate = function(dateStr) {
        return moment(dateStr).format('LLL');
    }
}]);
