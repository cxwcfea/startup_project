'use strict';
angular.module('supportApp').controller('SupportApplyCtrl', ['$scope', '$http', '$location', '$modal', 'gbNotifier', 'days', 'util', '$filter', function($scope, $http, $location, $modal, gbNotifier, days, util, $filter) {
    var vm = this;
    var apply_list = {};
    var currentApplies;
    vm.itemsPerPage = 15;

    initData();

    function pageReset() {
        vm.totalItems = currentApplies.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }
    
    vm.showAllApplies = function() {
        vm.totalItems = apply_list.length;
        currentApplies = apply_list;
        vm.currentPage = 1;
        vm.pageChanged();
    };

    function initData() {
        $http.get('/admin/api/applies/all').success(function(data) {
            apply_list = $filter('orderBy')(data, 'createdAt', true);
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
        if (!vm.searchKey) {
            return;
        }
        currentApplies = [];
        for (var key in apply_list) {
            if (apply_list[key].serialID == vm.searchKey) {
                currentApplies.push(apply_list[key]);
                break;
            }
        }
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

