'use strict';
angular.module('mobileApp').controller('MobileTtnCtrl', ['$scope', '$window', '$location', '$http', 'days', 'util', function($scope, $window, $location, $http, days, util) {
    var vm = this;

    vm.min_amount = 2000;
    vm.max_amount = 300000;
    var startTime = days.startTime();

    vm.leverList = [
        /*
        {
            name: '10倍',
            value: 10
        },
        {
            name: '9倍',
            value: 9
        },
        */
        {
            name: '7倍',
            value: 8
        },
        {
            name: '6倍',
            value: 7
        },
        {
            name: '5倍',
            value: 6
        },
        {
            name: '4倍',
            value: 5
        },
        {
            name: '3倍',
            value: 4
        },
        {
            name: '2倍',
            value: 3
        },
        {
            name: '1倍',
            value: 2
        }
    ];
    vm.agree = true;
    vm.showOtherAmount = false;
    vm.otherAmount;
    vm.selectedLever = vm.leverList[0];

    vm.summary = {
        day: 1,
        amount: 2000
    };
    vm.endTime = days.endTime(startTime, vm.summary.day);

    function calculateSummery() {
        vm.summary.lever = vm.selectedLever.value;
        vm.summary.deposit = vm.summary.amount * depositFactor;
        vm.summary.warnValue = util.getWarnValue(vm.summary.amount, vm.summary.deposit);
        vm.summary.sellValue = util.getSellValue(vm.summary.amount, vm.summary.deposit);
        vm.summary.serviceCharge = util.getServiceCharge(vm.summary.lever);
        var charge = vm.summary.amount / 10000 * vm.summary.serviceCharge; // * vm.summary.day;
        vm.summary.charge = charge;
        vm.summary.total = vm.summary.deposit + charge;
        vm.endTime = days.endTime(startTime, vm.summary.day);
    }

    var depositFactor = 1 / vm.selectedLever.value;
    calculateSummery();

    vm.amountList = [
        {
            name: '2000元',
            value: '2000',
            select: true
        },
        {
            name: '1万',
            value: "10000"
        },
        {
            name: '2万',
            value: "20000"
        },
        {
            name: '3万',
            value: "30000"
        },
        {
            name: '5万',
            value: "50000"
        },
        {
            name: '10万',
            value: "100000"
        },
        {
            name: '20万',
            value: "200000"
        },
        {
            name: '30万',
            value: "300000"
        }
    ];


    function unselectAll() {
        angular.forEach(vm.amountList, function(value, key) {
            value.select = false;
        });
    }

    function tryOtherAmount() {
        if (vm.otherAmount >= vm.min_amount) {
            if (vm.otherAmount <= vm.max_amount) {
                vm.summary.amount = Math.floor(vm.otherAmount);
            } else {
                vm.otherAmount = vm.summary.amount = vm.max_amount;
            }
        } else {
            vm.summary.amount = 0;
        }
        calculateSummery();
    }

    vm.selectAmount = function(item) {
        unselectAll();
        vm.showOtherAmount = false;
        //vm.otherAmount = 0;
        item.select = true;
        vm.summary.amount = item.value;
        calculateSummery();
    };

    vm.toggleOtherAmount = function() {
        vm.showOtherAmount = !vm.showOtherAmount;
        if (!vm.showOtherAmount) {
            vm.selectAmount(vm.amountList[0]);
        } else {
            tryOtherAmount();
        }
    };

    vm.finishOtherAmount = function() {
        tryOtherAmount();
    };

    function _submitApply() {
        $http.post('/apply', vm.summary)
            .success(function(data, status, headers, config) {
                console.log('success ' + data.apply_serial_id);
                $location.path('/ttn_confirm/' + data.apply_serial_id);
            })
            .error(function(data, status, headers, config) {
                if (status === 401) {
                    $scope.data.lastLocation = '/ttn';
                    $location.path('/login');
                } else {
                    console.log(data.error_msg);
                }
            });
    }

    vm.submitApply = function() {
        if (!vm.agree) {
            alert('您必须同意《牛金操盘协议》');
            return;
        }
        if (vm.summary.amount <= 0 || vm.summary.amount > 300000) {
            alert('金额必须在2000元到30万之间');
            return;
        }
        _submitApply();
    };

    vm.leverChange = function() {
        depositFactor = 1 / vm.selectedLever.value;
        calculateSummery();
    };
}]);