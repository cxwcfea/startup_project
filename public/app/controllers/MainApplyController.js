(function () {
    'use strict';
    angular.module('mainApp', ['ui.bootstrap', 'commonApp']);
    angular.module('mainApp').controller('MainApplyController', ['$http', '$location', '$window', 'days', '$modal', function($http, $location, $window, days, $modal) {
        var vm = this;

        vm.min_amount = 2000;
        var warnFactor = 0.96;
        var sellFactor = 0.94;
        var depositFactor = 0.1;
        var serviceCharge = 19.9;
        var startTime = days.startTime();

        vm.agree = true;
        vm.showOtherAmount = false;
        vm.otherAmount;

        vm.summary = {
            day: 1,
            amount: 2000
        };
        vm.endTime = days.endTime(startTime, vm.summary.day);

        vm.forbiddenStockList;

        function calculateSummery() {
            vm.summary.warnValue = vm.summary.amount * warnFactor;
            vm.summary.sellValue = vm.summary.amount * sellFactor;
            vm.summary.deposit = vm.summary.amount * depositFactor;
            var charge = vm.summary.amount / 10000 * serviceCharge; // * vm.summary.day;
            vm.summary.charge = charge;
            vm.summary.total = vm.summary.deposit + charge;
            vm.endTime = days.endTime(startTime, vm.summary.day);
        }

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
                vm.summary.amount = Math.floor(vm.otherAmount);
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

        vm.showForbiddenStocks = function() {
            console.log('show stock');
            if (!vm.forbiddenStockList) {
                $http.get('/api/fetch_forbidden_stocks').
                    success(function(data, status, headers, config) {
                        vm.forbiddenStockList = data;
                        var theModal = $('#forbidden-stock-modal');
                        theModal.modal('open');
                    }).
                    error(function(data, status, headers, config) {
                    });
            } else {
                var theModal = $('#forbidden-stock-modal');
                theModal.modal('open');
            }
        };
    }]);
}());
