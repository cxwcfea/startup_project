'use strict';
angular.module('adminApp').controller('AdminClosingApplyCtrl', ['$scope', '$http', '$location', '$modal', 'gbNotifier', 'days', function($scope, $http, $location, $modal, gbNotifier, days) {
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

    function initData() {
        $http.get('/admin/api/applies/closing').success(function(data) {
            apply_list = data;
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
    }

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
            if (!result.profit) {
                gbNotifier.error('必须输入盈亏金额');
                return;
            }
            var data = {
                apply_id: apply._id,
                profit: result.profit
            };
            $http.post('/admin/api/close_apply', data)
                .success(function(data, status, headers, config) {
                    console.log(data);
                    gbNotifier.notify('结算成功');
                }).
                error(function(data, status, headers, config) {
                    gbNotifier.error('结算失败:' + data.reason);
                });
            /*
            apply.account = content.account;
            apply.password = content.password;
            apply.status = 2;
            apply.$save(function(data) {
                formatData(apply);
                gbNotifier.notify('更新成功!');
            }, function(response) {
                console.log(response);
                gbNotifier.error('更新失败:');
            });
            */
        }, function () {
        });
    };
}]);

angular.module('adminApp').controller('ApplyClosingModalCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.data = {};
    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

