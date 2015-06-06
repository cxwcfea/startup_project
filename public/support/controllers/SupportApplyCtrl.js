'use strict';
angular.module('supportApp').controller('SupportApplyCtrl', ['$scope', '$http', '$location', '$modal', 'gbNotifier', 'days', 'util', '$filter', function($scope, $http, $location, $modal, gbNotifier, days, util, $filter) {
    var vm = this;
    var apply_list = {};
    var currentApplies;
    $scope.apply_options = ["全部","待支付", "操盘中", "已结算", "审核中", "结算中", "排队中"];
    vm.itemsPerPage = 15;
    vm.maxSize = 8;
    vm.totalApplyAmount = 0.0;
    vm.apply_status = "全部";

    initData();

    function pageReset() {
        vm.totalItems = currentApplies.length;
        vm.totalApplyAmount = 0.0;
        for(var key in currentApplies) {
            vm.totalApplyAmount += currentApplies[key].amount;
        }
        vm.currentPage = 1;
        vm.pageChanged();
    }
    
    vm.showAllApplies = function() {
        vm.totalItems = apply_list.length;
        currentApplies = apply_list;
        vm.currentPage = 1;
        vm.orderId = '';
        vm.homsAccount = '';
        vm.userMobile = '';
        vm.apply_status = "全部";
        pageReset();
    };

    function initData() {
        $http.get('/admin/api/applies/all').success(function(data) {
            apply_list = $filter('orderBy')(data, 'applyAt', true);
            angular.forEach(apply_list, function(value, key) {
                formatData(value);
            });
            currentApplies = apply_list;
            pageReset();
        });
    }

    function formatData (item) {
        item.start_date = item.startTime ? item.startTime : days.startTime();
        item.end_date = item.endTime ? item.endTime : days.endTime(item.start_date, item.period);
        item.fee = util.getServiceFee(item, item.period);
    }

    vm.searchApply = function() {
        if (!vm.orderId && !vm.apply_status && !vm.userMobile && vm.homsAccount) {
            return;
        }
        currentApplies = [];
        var apply_candis = apply_list;

        if (vm.orderId) {
            for (var key in apply_candis) {
                if (apply_candis[key].serialID === vm.orderId) {
                    currentApplies.push(apply_candis[key]);
                    break;
                }
            }
            apply_candis = currentApplies;
        }
        if (vm.apply_status) {
            currentApplies = [];
            var apply_status_code = $scope.apply_options.indexOf(vm.apply_status);
            if(6 === apply_status_code) {
                apply_status_code = 9;
            }
            if(apply_status_code > 0) {
                for (var key in apply_candis) {
                    if (apply_candis[key].status === apply_status_code) {
                        currentApplies.push(apply_candis[key]);
                    }
                }
                apply_candis = currentApplies;
           }
        }
        if (vm.userMobile) {
            currentApplies = [];
            for (var key in apply_candis) {
                if (apply_candis[key].userMobile == vm.userMobile) {
                    currentApplies.push(apply_candis[key]);
                }
            }
            apply_candis = currentApplies;
        }
        if (vm.homsAccount) {
            currentApplies = [];
            for (var key in apply_candis) {
                if (apply_candis[key].account === vm.homsAccount) {
                    currentApplies.push(apply_candis[key]);
                }
            }
            apply_candis = currentApplies;
        }
        currentApplies = apply_candis;

        vm.totalItems = currentApplies.length;
        pageReset();
    };

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentApplies.slice(start, end);
    };

    vm.manageApply = function(apply) {
        var modalInstance = $modal.open({
            templateUrl: 'applyClosingModal.html',
            controller: 'ApplyClosingModalCtrl',
            resolve: {}
        });

        modalInstance.result.then(function (result) {
            if (result.profit === null || result.profit === undefined) {
                gbNotifier.error('必须输入盈亏金额');
                return;
            }
            var data = {
                apply_serial_id: apply.serialID,
                profit: result.profit
            };
            $http.post('/admin/api/close_apply', data)
                .success(function(data, status, headers, config) {
                    gbNotifier.notify('结算成功');
                }).
                error(function(data, status, headers, config) {
                    gbNotifier.error('结算失败:' + data.err_msg);
                });
        }, function () {
        });
    };

    vm.takeApply = function(apply) {
        $http.post('/admin/api/take_apply', {id:apply.serialID})
            .success(function(data, status) {
                apply.manager = data.manager;
                gbNotifier.notify('更新成功!');
            })
            .error(function(data, status) {
                gbNotifier.error('更新失败!');
            });
    };
}]);

angular.module('supportApp').controller('ApplyClosingModalCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.data = {};
    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

