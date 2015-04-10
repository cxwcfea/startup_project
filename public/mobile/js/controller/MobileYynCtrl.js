'use strict';
angular.module('mobileApp').controller('MobileYynCtrl', ['$scope', '$window', 'util', function($scope, $window, util) {
    var vm = this;

    vm.summary = {};
    vm.summary.amount = 0;
    //vm.summary.deposit = 0;
    vm.summary.warnValue = 0;
    vm.summary.sellValue = 0;
    vm.parameterList = [
        {
            name: '2倍',
            interest: 1.3,
            value: 2,
            i_value: 0.013
        },
        {
            name: '3倍',
            interest: 1.4,
            value: 3,
            i_value: 0.014
        },
        {
            name: '4倍',
            interest: 1.5,
            value: 4,
            i_value: 0.015
        },
        {
            name: '5倍',
            interest: 1.6,
            value: 5,
            i_value: 0.016
        },
        {
            name: '6倍',
            interest: 1.7,
            value: 6,
            i_value: 0.017
        }
    ];

    vm.periodList = [];
    for (var i = 1; i <= 12; ++i) {
        var obj = {
            name: i+'个月',
            value: i
        };
        vm.periodList.push(obj);
    }

    vm.selectedValue = vm.parameterList[0];
    vm.selectedMonth = vm.periodList[0];
    vm.summary.month = 1;
    vm.summary.charge = 0;

    vm.selectLever = function(item) {
        vm.selectedValue = item;
        vm.calculateValue();
    };

    vm.calculateValue = function() {
        if (vm.summary.deposit >= 10000 && vm.summary.deposit <= 200000) {
            vm.summary.lever = vm.selectedValue.value;
            vm.summary.amount = vm.summary.deposit * vm.selectedValue.value;
            vm.summary.warnValue = util.getWarnValue(vm.summary.amount, vm.summary.deposit);
            vm.summary.sellValue = util.getSellValue(vm.summary.amount, vm.summary.deposit);
            var charge = vm.summary.amount * vm.selectedValue.i_value * vm.summary.month;
            vm.summary.charge = charge;
        } else {
            vm.summary.amount = 0;
            vm.summary.warnValue = 0;
            vm.summary.sellValue = 0;
            vm.summary.charge = 0;
        }
    };

    vm.monthChange = function() {
        vm.summary.month = vm.selectedMonth.value;
        vm.calculateValue();
    };
}]);