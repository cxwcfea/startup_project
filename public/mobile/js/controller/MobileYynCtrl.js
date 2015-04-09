'use strict';
angular.module('mobileApp').controller('MobileYynCtrl', ['$scope', '$window', function($scope, $window) {
    var vm = this;

    vm.parameterList = [
        {
            name: '2倍',
            value: 2
        },
        {
            name: '3倍',
            value: 3
        },
        {
            name: '4倍',
            value: 4
        },
        {
            name: '5倍',
            value: 5
        },
        {
            name: '6倍',
            value: 6
        }
    ];
}]);