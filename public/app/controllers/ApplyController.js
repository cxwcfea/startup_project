(function () {
    'use strict';
    var holiday = [
        moment("2015-03-14").dayOfYear(),
        moment("2015-03-15").dayOfYear(),
        moment("2015-03-21").dayOfYear(),
        moment("2015-03-22").dayOfYear(),
        moment("2015-03-28").dayOfYear(),
        moment("2015-03-29").dayOfYear(),
        moment("2015-04-04").dayOfYear(),
        moment("2015-04-05").dayOfYear(),
        moment("2015-04-06").dayOfYear(),
        moment("2015-04-11").dayOfYear(),
        moment("2015-04-12").dayOfYear(),
        moment("2015-04-18").dayOfYear(),
        moment("2015-04-19").dayOfYear(),
        moment("2015-04-25").dayOfYear(),
        moment("2015-04-26").dayOfYear(),
        moment("2015-05-01").dayOfYear(),
        moment("2015-05-02").dayOfYear(),
        moment("2015-05-03").dayOfYear(),
        moment("2015-05-09").dayOfYear(),
        moment("2015-05-10").dayOfYear(),
        moment("2015-05-16").dayOfYear(),
        moment("2015-05-17").dayOfYear(),
        moment("2015-05-23").dayOfYear(),
        moment("2015-05-24").dayOfYear(),
        moment("2015-06-06").dayOfYear(),
        moment("2015-06-07").dayOfYear(),
        moment("2015-06-13").dayOfYear(),
        moment("2015-06-14").dayOfYear(),
        moment("2015-06-20").dayOfYear(),
        moment("2015-06-21").dayOfYear(),
        moment("2015-06-22").dayOfYear(),
        moment("2015-06-27").dayOfYear(),
        moment("2015-06-28").dayOfYear(),
        moment("2015-07-04").dayOfYear(),
        moment("2015-07-05").dayOfYear(),
        moment("2015-07-11").dayOfYear(),
        moment("2015-07-12").dayOfYear(),
        moment("2015-07-18").dayOfYear(),
        moment("2015-07-19").dayOfYear(),
        moment("2015-07-25").dayOfYear(),
        moment("2015-07-26").dayOfYear(),
        moment("2015-08-01").dayOfYear(),
        moment("2015-08-02").dayOfYear(),
        moment("2015-08-08").dayOfYear(),
        moment("2015-08-09").dayOfYear(),
        moment("2015-08-15").dayOfYear(),
        moment("2015-08-16").dayOfYear(),
        moment("2015-08-22").dayOfYear(),
        moment("2015-08-23").dayOfYear(),
        moment("2015-08-29").dayOfYear(),
        moment("2015-08-30").dayOfYear(),
        moment("2015-09-05").dayOfYear(),
        moment("2015-09-06").dayOfYear(),
        moment("2015-09-12").dayOfYear(),
        moment("2015-09-13").dayOfYear(),
        moment("2015-09-19").dayOfYear(),
        moment("2015-09-20").dayOfYear(),
        moment("2015-09-26").dayOfYear(),
        moment("2015-09-27").dayOfYear(),
        moment("2015-10-01").dayOfYear(),
        moment("2015-10-02").dayOfYear(),
        moment("2015-10-03").dayOfYear(),
        moment("2015-10-04").dayOfYear(),
        moment("2015-10-05").dayOfYear(),
        moment("2015-10-06").dayOfYear(),
        moment("2015-10-07").dayOfYear(),
        moment("2015-10-10").dayOfYear(),
        moment("2015-10-11").dayOfYear(),
        moment("2015-10-17").dayOfYear(),
        moment("2015-10-18").dayOfYear(),
        moment("2015-10-24").dayOfYear(),
        moment("2015-10-25").dayOfYear(),
        moment("2015-10-31").dayOfYear(),
        moment("2015-11-01").dayOfYear(),
        moment("2015-11-07").dayOfYear(),
        moment("2015-11-08").dayOfYear(),
        moment("2015-11-14").dayOfYear(),
        moment("2015-11-15").dayOfYear(),
        moment("2015-11-21").dayOfYear(),
        moment("2015-11-22").dayOfYear(),
        moment("2015-11-28").dayOfYear(),
        moment("2015-11-29").dayOfYear(),
        moment("2015-12-05").dayOfYear(),
        moment("2015-12-06").dayOfYear(),
        moment("2015-12-12").dayOfYear(),
        moment("2015-12-13").dayOfYear(),
        moment("2015-12-19").dayOfYear(),
        moment("2015-12-20").dayOfYear(),
        moment("2015-12-26").dayOfYear(),
        moment("2015-12-27").dayOfYear()
    ];

    var getStartDay = function() {
        var startDay = moment().startOf('day');
        if (moment().hour() > 14 || (moment().hour() == 14 && moment().minute() >= 30)) {
            startDay = moment().endOf('day').add(1, 'ms');
        }

        while (true) {
            var dayOfYear = startDay.dayOfYear();
            if (holiday.indexOf(dayOfYear) === -1) {
                break;
            }
            startDay = startDay.add(1, 'day');
        }
        return startDay;
    };
    angular.module('applyApp', []);
    angular.module('applyApp').controller('ApplyController', ['$http', '$location', '$window', function($http, $location, $window) {
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

        vm.startTime = getStartDay();

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
