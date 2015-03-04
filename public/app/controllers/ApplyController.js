'use strict';
angular.module('applyApp').controller('ApplyController', ['$http', '$location', '$window', function($http, $location, $window) {
    var vm = this;

    var warnFactor = 0.93;
    var sellFactor = 0.95;
    var depositFactor = 0.1;
    var serviceCharge = 18.8;

    vm.showOtherAmount = false;
    vm.otherAmount = 0;

    vm.summery = {
        day: 5,
        amount: 50000
    };

    function calculateSummery() {
        vm.summery.warnValue = vm.summery.amount * warnFactor;
        vm.summery.sellValue = vm.summery.amount * sellFactor;
        vm.summery.deposit = vm.summery.amount * depositFactor;
        var charge = vm.summery.amount / 10000 * serviceCharge * vm.summery.day;
        vm.summery.charge = charge.toFixed(2);
        vm.summery.total = (vm.summery.deposit + charge).toFixed(2);
    }

    calculateSummery();

    vm.amountList = [
        {
            name: '2000元',
            value: '2000'
        },
        {
            name: '1万',
            value: "10000"
        },
        {
            name: '3万',
            value: "30000"
        },
        {
            name: '5万',
            value: "50000",
            select: true
        },
        {
            name: '10万',
            value: "100000"
        },
        {
            name: '30万',
            value: "300000"
        }
    ];

    vm.dayList = [
        {
            value: '2'
        },
        {
            value: '5',
            select: true
        },
        {
            value: '8'
        },
        {
            value: '10'
        }
    ];

    function unselectAll() {
        angular.forEach(vm.amountList, function(value, key) {
            value.select = false;
        });
    }

    function unselectDay() {
        angular.forEach(vm.dayList, function(value, key) {
            value.select = false;
        });
    }

    vm.selectAmount = function(item) {
        unselectAll();
        vm.showOtherAmount = false;
        vm.otherAmount = 0;
        item.select = true;
        vm.summery.amount = item.value;
        calculateSummery();
    };

    vm.selectDay = function(day) {
        unselectDay();
        day.select = true;
        vm.summery.day = day.value;
        calculateSummery();
    };

    vm.toggleOtherAmount = function() {
        unselectAll();
        vm.showOtherAmount = !vm.showOtherAmount;
        vm.summery.amount = vm.otherAmount;
    };

    vm.finishOtherAmount = function() {
        vm.summery.amount = vm.otherAmount;
        calculateSummery();
    };

    vm.submitApply = function() {
        $http.post('/apply', vm.summery)
            .then(function(response) {
                if (response.data.success) {
                    $window.location.href = '/apply_confirm';
                } else {
                    if (response.data.reason === 'not authenticate') {
                        $window.location.href = '/login';
                    }
                }
            });
    };
}]);
