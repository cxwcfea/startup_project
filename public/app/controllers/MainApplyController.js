(function () {
    'use strict';
    angular.module('mainApp', ['ui.bootstrap', 'commonApp']);

    angular.module('mainApp').config(['$httpProvider', function($httpProvider) {
        // Initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        // Disable IE ajax request caching
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
    }]);

    angular.module('mainApp').controller('MainApplyController', ['$http', '$location', '$window', 'days', 'util', function($http, $location, $window, days, util) {
        var vm = this;

        vm.min_amount = 2000;
        vm.max_amount = 300000;
        var depositFactor = 0.1;
        var serviceCharge = util.serviceCharge;
        var startTime = days.startTime();

        vm.leverList = [
            {
                name: '10倍',
                value: 10
            },
            {
                name: '9倍',
                value: 9
            },
            {
                name: '8倍',
                value: 8
            },
            {
                name: '7倍',
                value: 7
            },
            {
                name: '6倍',
                value: 6
            },
            {
                name: '5倍',
                value: 5
            },
            {
                name: '4倍',
                value: 4
            },
            {
                name: '3倍',
                value: 3
            },
            {
                name: '2倍',
                value: 2
            }
        ];
        vm.agree = true;
        vm.showOtherAmount = false;
        vm.otherAmount;
        vm.showLoginWindow = false;
        vm.selectedLever = vm.leverList[0];

        vm.summary = {
            day: 1,
            amount: 2000
        };
        vm.endTime = days.endTime(startTime, vm.summary.day);

        vm.forbiddenStockList;

        function calculateSummery() {
            vm.summary.lever = vm.selectedLever.value;
            vm.summary.deposit = vm.summary.amount * depositFactor;
            vm.summary.warnValue = util.getWarnValue(vm.summary.amount, vm.summary.deposit);
            vm.summary.sellValue = util.getSellValue(vm.summary.amount, vm.summary.deposit);
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
                    $window.location.href = '/apply_confirm/' + data.apply_serial_id;
                })
                .error(function(data, status, headers, config) {
                    if (status === 401) {
                        vm.showLoginWindow = true;
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
                var theModal = $('#invalid-value-modal');
                theModal.modal('open');
                return;
            }
            _submitApply();
        };

        vm.leverChange = function() {
            depositFactor = 1 / vm.selectedLever.value;
            calculateSummery();
        };

        vm.showForbiddenStocks = function() {
            if (!vm.forbiddenStockList) {
                $http.get('/api/fetch_forbidden_stocks').
                    success(function(data, status, headers, config) {
                        vm.forbiddenStockList = data;
                        var theModal = $('#forbidden-stock-modal');
                        theModal.modal({
                            width: 750,
                            height: 450
                        });
                    }).
                    error(function(data, status, headers, config) {
                    });
            } else {
                var theModal = $('#forbidden-stock-modal');
                theModal.modal('open');
            }
        };

        vm.login = function() {
            if (!vm.mobile) {
                addAlert('danger', '请输入有效的手机号');
                return;
            }
            if (!vm.password) {
                addAlert('danger', '请输入密码，6到20位');
                return;
            }
            $http.post('/api/login', {mobile:vm.mobile, password:vm.password})
                .success(function(data, status, headers, config) {
                    _submitApply();
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', data.error_msg);
                });
        };

        vm.alerts = [];

        var addAlert = function(type, msg) {
            vm.alerts = [];
            vm.alerts.push({type:type, msg: msg});
        };

        vm.closeAlert = function(index) {
            vm.alerts.splice(index, 1);
        };
    }]);

    angular.module('mainApp').controller('MainApplyConfirmController', ['$http', '$location', '$window', 'days', 'service_charge', function($http, $location, $window, days, service_charge) {
        var vm = this;
        vm.apply = {};
        if (!!$window.bootstrappedApplyObject) {
            angular.extend(vm.apply, $window.bootstrappedApplyObject);
        }

        vm.validDays = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

        function calculateAmount() {
            vm.serviceFee = vm.apply.amount / 10000 * service_charge * vm.apply.period;
            vm.totalAmount = vm.apply.deposit + vm.serviceFee;
            vm.shouldPay = vm.totalAmount - vm.apply.userBalance;
            if (vm.shouldPay <= 0) {
                vm.shouldPay = 0;
                vm.balancePay = true;
            } else {
                vm.balancePay = false;
            }
        }

        calculateAmount();

        vm.selectDay = function() {
            calculateAmount();
        };

        vm.payForApply = function() {
            vm.apply.shouldPay = vm.shouldPay;
            vm.apply.totalAmount = vm.totalAmount;
            $http.post('/apply_confirm', vm.apply)
                .success(function(data, status, headers, config) {
                    if (vm.shouldPay === 0) {
                        var dataObj = {
                            apply_serial_id: data.apply.serialID,
                            order_id: data.order._id
                        };
                        $http.post('/api/users/pay_by_balance', dataObj)
                            .success(function(res) {
                                $window.location.assign('/apply/pay_success?serial_id=' + data.apply.serialID + '&amount=' + data.apply.amount);
                            })
                            .error(function(res, status) {
                                console.log('error:' + res.error_msg);
                            });
                    } else {
                        $window.location.assign('/recharge?order_id=' + data.order._id);
                    }
                })
                .error(function(data, status, headers, config) {
                    console.log('error:' + data.reason);
                });
        };

    }]);

    angular.module('mainApp').controller('MainYynCtrl', ['$scope', '$http', '$location', '$window', 'days', 'util', function($scope, $http, $location, $window, days, util) {
        $scope.showLoginWindow = false;

        $scope.forbiddenStockList;
        $scope.agree = true;
        $scope.summary = {};
        $scope.summary.amount = 0;
        //$scope.summary.deposit = 0;
        $scope.summary.warnValue = 0;
        $scope.summary.sellValue = 0;
        $scope.parameterList = [
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

        $scope.periodList = [];
        for (var i = 1; i <= 12; ++i) {
            var obj = {
                name: i+'个月',
                value: i
            };
            $scope.periodList.push(obj);
        }

        $scope.selectedValue = $scope.parameterList[0];
        $scope.selectedMonth = $scope.periodList[0];
        $scope.summary.month = 1;
        $scope.summary.charge = 0;

        $scope.selectLever = function(item) {
            console.log('run');
            $scope.selectedValue = item;
            $scope.calculateValue();
        };

        $scope.calculateValue = function() {
            if ($scope.summary.deposit >= 250000 && $scope.summary.deposit <= 1000000) {
                $scope.summary.lever = $scope.selectedValue.value;
                $scope.summary.amount = $scope.summary.deposit * $scope.selectedValue.value;
                $scope.summary.warnValue = util.getWarnValue($scope.summary.amount, $scope.summary.deposit);
                $scope.summary.sellValue = util.getSellValue($scope.summary.amount, $scope.summary.deposit);
                $scope.charge = $scope.summary.amount * $scope.selectedValue.i_value;
                $scope.summary.charge = $scope.charge * $scope.summary.month;
            } else {
                $scope.summary.amount = 0;
                $scope.summary.warnValue = 0;
                $scope.summary.sellValue = 0;
                $scope.summary.charge = 0;
            }
        };

        $scope.monthChange = function() {
            $scope.summary.month = $scope.selectedMonth.value;
            $scope.calculateValue();
        };

        function _submitApply() {
            $scope.summary.type = 2;
            $scope.summary.interestRate = $scope.selectedValue.i_value;
            $http.post('/apply', $scope.summary)
                .success(function(data, status, headers, config) {
                    $window.location.href = '/yyn_confirm/' + data.apply_serial_id;
                })
                .error(function(data, status, headers, config) {
                    if (status === 401) {
                        $scope.showLoginWindow = true;
                    } else {
                        console.log(data.error_msg);
                    }
                });
        }

        $scope.submitApply = function() {
            if (!$scope.agree) {
                alert('您必须同意《牛金操盘协议》');
                return;
            }
            if ($scope.summary.amount <= 0) {
                var theModal = $('#invalid-value-modal');
                theModal.modal('open');
                return;
            }
            _submitApply();
        };

        $scope.showForbiddenStocks = function() {
            if (!$scope.forbiddenStockList) {
                $http.get('/api/fetch_forbidden_stocks').
                    success(function(data, status, headers, config) {
                        $scope.forbiddenStockList = data;
                        var theModal = $('#forbidden-stock-modal');
                        theModal.modal({
                            width: 750,
                            height: 450
                        });
                    }).
                    error(function(data, status, headers, config) {
                    });
            } else {
                var theModal = $('#forbidden-stock-modal');
                theModal.modal('open');
            }
        };

        $scope.login = function() {
            if (!$scope.mobile) {
                addAlert('danger', '请输入有效的手机号');
                return;
            }
            if (!$scope.password) {
                addAlert('danger', '请输入密码，6到20位');
                return;
            }
            $http.post('/api/login', {mobile:$scope.mobile, password:$scope.password})
                .success(function(data, status, headers, config) {
                    _submitApply();
                })
                .error(function(data, status, headers, config) {
                    addAlert('danger', data.error_msg);
                });
        };

        $scope.alerts = [];

        var addAlert = function(type, msg) {
            $scope.alerts = [];
            $scope.alerts.push({type:type, msg: msg});
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
    }]);

    angular.module('mainApp').controller('MainYYnConfirmCtrl', ['$scope', '$http', '$location', '$window', 'days', function($scope, $http, $location, $window, days) {
        $scope.apply = {};
        if (!!$window.bootstrappedApplyObject) {
            angular.extend($scope.apply, $window.bootstrappedApplyObject);
        }

        $scope.interest = $scope.apply.amount * $scope.apply.interestRate;
        $scope.totalAmount = $scope.apply.deposit + $scope.interest;
        $scope.shouldPay = $scope.totalAmount - $scope.apply.userBalance;
        console.log($scope.apply);
        if ($scope.shouldPay <= 0) {
            $scope.shouldPay = 0;
            $scope.balancePay = true;
        } else {
            $scope.balancePay = false;
        }

        $scope.payForApply = function() {
            $scope.apply.shouldPay = $scope.shouldPay;
            $scope.apply.totalAmount = $scope.totalAmount;
            $http.post('/apply_confirm', $scope.apply)
                .success(function(data, status, headers, config) {
                    if ($scope.shouldPay === 0) {
                        var dataObj = {
                            apply_serial_id: data.apply.serialID,
                            order_id: data.order._id
                        };
                        $http.post('/api/users/pay_by_balance', dataObj)
                            .success(function(res) {
                                $window.location.assign('/apply/pay_success?serial_id=' + data.apply.serialID + '&amount=' + data.apply.amount);
                            })
                            .error(function(res, status) {
                                console.log('error:' + res.error_msg);
                            });
                    } else {
                        $window.location.assign('/recharge?order_id=' + data.order._id);
                    }
                })
                .error(function(data, status, headers, config) {
                    console.log('error:' + data.reason);
                });
        };

    }]);
}());
