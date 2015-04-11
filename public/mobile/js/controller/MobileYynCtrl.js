'use strict';
angular.module('mobileApp').controller('MobileYynCtrl', ['$scope', '$window', '$http', '$location', 'util', function($scope, $window, $http, $location, util) {
    var vm = this;

    vm.summary = {};
    vm.summary.amount = 0;
    //vm.summary.deposit = 0;
    vm.summary.warnValue = 0;
    vm.summary.sellValue = 0;
    vm.parameterList = [
        {
            name: '2倍',
            interest: 1.2,
            value: 2,
            i_value: 0.012
        },
        {
            name: '3倍',
            interest: 1.3,
            value: 3,
            i_value: 0.013
        },
        {
            name: '4倍',
            interest: 1.4,
            value: 4,
            i_value: 0.014
        },
        {
            name: '5倍',
            interest: 1.5,
            value: 5,
            i_value: 0.015
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
        if (vm.summary.deposit >= 250000 && vm.summary.deposit <= 1000000) {
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

    vm.submitApply = function() {
        if (vm.summary.amount <= 0) {
            alert('请输入有效资金,最低25万,最高100万');
            return;
        }
        vm.summary.type = 2;
        vm.summary.interestRate = vm.selectedValue.i_value;
        $http.post('/apply', vm.summary)
            .success(function(data, status, headers, config) {
                $location.path('/yyn_confirm/' + data.apply_serial_id);
            })
            .error(function(data, status, headers, config) {
                if (status === 401) {
                    $scope.data.lastLocation = '/yyn';
                    $location.path('/login');
                } else {
                    console.log(data.error_msg);
                }
            });
    };
}]);