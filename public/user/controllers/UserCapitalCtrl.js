'use strict';
angular.module('userApp').controller('UserCapitalCtrl', ['$scope', '$window', function($scope, $window) {
    var vm = this;
    $('.footer').addClass('marTop200');

    $scope.data.menu = 2;

    vm.categories = [
        {
            file: '/views/recharge.html',
            name: '充值',
            value: 0
        },
        {
            file: '/views/withdraw.html',
            name: '提现',
            value: 1
        },
        {
            file: '/views/user_orders.html',
            name: '资金明细',
            value: 2
        },
        {
            file: '/views/my_cards.html',
            name: '我的银行卡',
            value: 3
        }
    ];

    vm.currentCategory = 2;

    vm.selectCategory = function(c) {
        vm.currentCategory = c.value;
    };

    vm.selectedCategory = function() {
        return vm.categories[vm.currentCategory].file;
    };

}]);