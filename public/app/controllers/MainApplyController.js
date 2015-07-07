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
        vm.max_amount = 1000000;
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
             */
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
        vm.discount = 1;

        vm.summary = {
            day: 1,
            amount: 5000
        };
        vm.endTime = days.endTime(startTime, vm.summary.day);

        vm.forbiddenStockList;

        function calculateSummery() {
            vm.summary.lever = vm.selectedLever.value;
            vm.summary.deposit = vm.summary.amount * depositFactor;
            vm.summary.warnValue = util.getWarnValue(vm.summary.amount, vm.summary.deposit);
            vm.summary.sellValue = util.getSellValue(vm.summary.amount, vm.summary.deposit);
            vm.summary.serviceCharge = util.getServiceCharge(vm.summary.lever);
            var charge = vm.summary.amount / 10000 * vm.summary.serviceCharge; // * vm.summary.day;
            vm.summary.charge = charge * vm.discount;
            vm.summary.total = vm.summary.deposit + charge;
            vm.endTime = days.endTime(startTime, vm.summary.day);
        }

        var depositFactor = 1 / vm.selectedLever.value;
        calculateSummery();

        vm.amountList = [
            {
                name: '5000元',
                value: "5000",
                select: true
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
                value: "50000"
            },
            {
                name: '10万',
                value: "100000"
            },
            {
                name: '30万',
                value: "300000"
            },
            {
                name: '50万',
                value: "500000"
            },
            {
                name: '100万',
                value: "1000000"
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
            if (vm.summary.amount <= 0 || vm.summary.amount > 1000000) {
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

    angular.module('mainApp').controller('MainApplyConfirmController', ['$http', '$location', '$window', 'days', 'util', function($http, $location, $window, days, util) {
        var vm = this;
        vm.autoPostpone = true;
        vm.apply = {};
        if (!!$window.bootstrappedApplyObject) {
            angular.extend(vm.apply, $window.bootstrappedApplyObject);
        }
        vm.freeDays = 0;
        vm.rebate = vm.freeDays * vm.apply.serviceCharge * vm.apply.amount / 10000;

        vm.validDays = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

        function calculateAmount() {
            vm.serviceFee = util.getServiceFee(vm.apply);
            vm.totalAmount = vm.apply.deposit + vm.serviceFee - vm.rebate;
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
            vm.apply.autoPostpone = vm.autoPostpone;
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
                                $window.location.assign('/apply/pay_success?serial_id=' + data.apply.serialID + '&amount=' + data.apply.amount + '&type=' + 1);
                            })
                            .error(function(res, status) {
                                console.log('error:' + res.error_msg);
                            });
                    } else {
                        $window.location.assign('/recharge?order_id=' + data.order._id);
                    }
                })
                .error(function(data, status, headers, config) {
                    if (status === 403) {
                        if (data.error_code === 2) {
                            alert('对不起，同一用户最多只能有5笔操盘中的配资。暂不能再申请新的配资。');
                        } else if (data.error_code === 1) {
                            vm.showIdentityDialog = true;
                        }
                    }
                    console.log('error:' + data.reason);
                });
        };

        vm.redirectToIdentity = function() {
            $window.location.assign('/user/#/settings');
        };

    }]);

    angular.module('mainApp').controller('MainYynCtrl', ['$scope', '$http', '$location', '$window', 'days', 'util', function($scope, $http, $location, $window, days, util) {
        $scope.showLoginWindow = false;

        $scope.forbiddenStockList;
        $scope.agree = true;
        $scope.summary = {};
        //$scope.summary.amount = 0;
        $scope.summary.deposit = 0;
        $scope.summary.warnValue = 0;
        $scope.summary.sellValue = 0;
        $scope.parameterList = [
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
            }
            /*
            {
                name: '5倍',
                interest: 2.0,
                value: 5,
                i_value: 0.020
            }
            {
                name: '6倍',
                interest: 1.8,
                value: 6,
                i_value: 0.018
            }
            */
        ];

        $scope.periodList = [];
        for (var i = 1; i <= 6; ++i) {
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
            if ($scope.summary.amount >= 50000 && $scope.summary.amount <= 1000000) {
                $scope.summary.lever = $scope.selectedValue.value;
                $scope.summary.deposit = $scope.summary.amount / $scope.selectedValue.value;
                $scope.summary.warnValue = util.getWarnValue($scope.summary.amount, $scope.summary.deposit);
                $scope.summary.sellValue = util.getSellValue($scope.summary.amount, $scope.summary.deposit);
                $scope.charge = ($scope.summary.amount - $scope.summary.deposit) * $scope.selectedValue.i_value;
                $scope.summary.charge = $scope.charge * $scope.summary.month;
            } else {
                $scope.summary.deposit = 0;
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
            if ($scope.summary.deposit <= 0) {
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

        $scope.interest = ($scope.apply.amount - $scope.apply.deposit) * $scope.apply.interestRate;
        $scope.totalAmount = $scope.apply.deposit + $scope.interest;
        $scope.shouldPay = $scope.totalAmount - $scope.apply.userBalance;
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
                    console.log(data);
                    if (status === 403) {
                        if (data.error_code === 2) {
                            alert('对不起，同一用户最多只能有5笔操盘中的配资。暂不能再申请新的配资。');
                        } else if (data.error_code === 1) {
                            $scope.showIdentityDialog = true;
                        }
                    }
                    console.log('error:' + data.error_msg);
                });
        };

        $scope.redirectToIdentity = function() {
            $window.location.assign('/user/#/settings');
        };

    }]);
}());
