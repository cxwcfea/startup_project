(function () {
    'use strict';
    angular.module('applyApp', ['commonApp']);
    angular.module('applyApp').controller('ApplyController', ['$http', '$location', '$window', 'days', function($http, $location, $window, days) {
        var vm = this;

        var warnFactor = 0.93;
        var sellFactor = 0.95;
        var depositFactor = 0.1;
        var serviceCharge = 18.8;

        vm.agree = true;
        vm.showOtherAmount = false;
        vm.otherAmount = 2000;

        vm.summary = {
            day: 5,
            amount: 50000
        };

        vm.startTime = days.startTime();

        function calculateSummery() {
            vm.summary.warnValue = vm.summary.amount * warnFactor;
            vm.summary.sellValue = vm.summary.amount * sellFactor;
            vm.summary.deposit = vm.summary.amount * depositFactor;
            var charge = vm.summary.amount / 10000 * serviceCharge * vm.summary.day;
            vm.summary.charge = charge;
            vm.summary.total = vm.summary.deposit + charge;
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

        function tryOtherAmount() {
            if (vm.otherAmount >= 2000) {
                vm.summary.amount = Math.floor(vm.otherAmount);
            } else {
                vm.summary.amount = vm.otherAmount = 2000;
            }
            calculateSummery();
        }

        vm.selectAmount = function(item) {
            unselectAll();
            vm.showOtherAmount = false;
            vm.otherAmount = 0;
            item.select = true;
            vm.summary.amount = item.value;
            calculateSummery();
        };

        vm.selectDay = function(day) {
            unselectDay();
            day.select = true;
            vm.summary.day = day.value;
            calculateSummery();
        };

        vm.toggleOtherAmount = function() {
            unselectAll();
            vm.showOtherAmount = !vm.showOtherAmount;
            tryOtherAmount();
        };

        vm.finishOtherAmount = function() {
            tryOtherAmount();
        };

        vm.submitApply = function() {
            $http.post('/apply', vm.summary)
                .then(function(response) {
                    if (response.data.success) {
                        $window.location.href = '/apply_confirm/' + response.data.apply_id;
                    } else {
                        if (response.data.reason === 'not authenticate') {
                            $window.location.href = '/login';
                        }
                    }
                });
        };
    }]);
}());
