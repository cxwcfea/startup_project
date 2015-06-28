'use strict';
angular.module('mobileApp').controller('MobileYynCtrl', ['$scope', '$window', '$http', '$location', 'util', function($scope, $window, $http, $location, util) {
    var vm = this;

    vm.summary = {};
    //vm.summary.amount = 0;
    vm.summary.deposit = 0;
    vm.summary.warnValue = 0;
    vm.summary.sellValue = 0;
    vm.parameterList = [
        {
            name: '2倍',
            interest: 1.7,
            value: 2,
            i_value: 0.017
        },
        {
            name: '3倍',
            interest: 1.8,
            value: 3,
            i_value: 0.018
        },
        {
            name: '4倍',
            interest: 1.9,
            value: 4,
            i_value: 0.019
        },
        {
            name: '5倍',
            interest: 2.0,
            value: 5,
            i_value: 0.020
        }
        /*
        {
            name: '6倍',
            interest: 1.8,
            value: 6,
            i_value: 0.018
        }
        */
    ];

    vm.periodList = [];
    for (var i = 1; i <= 6; ++i) {
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
        if (vm.summary.amount >= 50000 && vm.summary.amount <= 1000000) {
            vm.summary.lever = vm.selectedValue.value;
            vm.summary.deposit = vm.summary.amount / vm.selectedValue.value;
            vm.summary.warnValue = util.getWarnValue(vm.summary.amount, vm.summary.deposit);
            vm.summary.sellValue = util.getSellValue(vm.summary.amount, vm.summary.deposit);
            var charge = (vm.summary.amount - vm.summary.deposit) * vm.selectedValue.i_value;
            vm.summary.charge = charge;
        } else {
            vm.summary.deposit = 0;
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
        if (vm.summary.deposit <= 0) {
            alert('请输入有效资金,最低5万,最高100万');
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