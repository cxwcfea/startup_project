'use strict';
angular.module('mobileApp').controller('MobileYynCtrl', ['$scope', '$window', function($scope, $window) {
    var vm = this;

    vm.parameterList = [
        {
            name: '2倍',
            interest: 1.3,
            value: 2
        },
        {
            name: '3倍',
            interest: 1.4,
            value: 3
        },
        {
            name: '4倍',
            interest: 1.5,
            value: 4
        },
        {
            name: '5倍',
            interest: 1.6,
            value: 5
        },
        {
            name: '6倍',
            interest: 1.7,
            value: 6
        }
    ];

    vm.selectedValue = vm.parameterList[0];

    vm.selectLever = function(item) {
        vm.selectedValue = item;
    };

    vm.calculateValue = function() {
        if (vm.amount >= 10000 && vm.amount <= 1000000) {

        }
    };
}]);