'use strict';
angular.module('adminApp').controller('AdminLossApplyListCtrl', ['$scope', '$http', '$location', '$modal', '$filter', 'gbNotifier', 'days', function($scope, $http, $location, $modal, $filter, gbNotifier, days) {
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
        $http.get('/admin/api/apply/loss_list').success(function(data) {
            apply_list = data;
            apply_list = $filter('orderBy')(apply_list, 'applyAt', true);
            currentApplies = apply_list;
            vm.totalLoss = 0;
            apply_list.forEach(function(elem) {
                elem.loss = (elem.deposit + elem.profit);
                vm.totalLoss += elem.loss;
            });
            pageReset();
        });
    }

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentApplies.slice(start, end);
    };

    vm.compensateLoss = function(apply) {
        var modalInstance = $modal.open({
            templateUrl: 'views/compensateLossModal.html',
            controller: 'UserCompensateLossModalCtrl2',
            //size: size,
            resolve: {
                apply: function () {
                    return apply;
                }
            }
        });

        modalInstance.result.then(function (result) {
            if (!result.order_amount || result.order_amount < 0) {
                gbNotifier.error('请输入有效的金额！');
            } else if (!result.apply_serial_id) {
                gbNotifier.error('请输入配资单号！');
            } else {
                result.userMobile = apply.userMobile;
                result.userID = apply.userID;
                $http.post('/admin/api/user_compensateLoss', result)
                    .success(function(data, status) {
                        gbNotifier.notify('追回成功！');
                    })
                    .error(function(data, status) {
                        gbNotifier.error('追回失败:' + data.error_msg);
                    });
            }
        }, function () {
        });
    };

    vm.showRelatedList = function(apply) {
        $http.get('/admin/api/order/apply_loss?serial_id=' + apply.serialID)
            .success(function(data, status) {
                vm.relatedOrders = data;
                console.log(data);
            })
            .error(function(data, status) {

            });
    };
}]);

angular.module('adminApp').controller('UserCompensateLossModalCtrl2', ['$scope', '$modalInstance', 'apply', function ($scope, $modalInstance, apply) {
    $scope.data = {};
    $scope.userMobile = apply.userMobile;
    $scope.data.apply_serial_id = apply.serialID;

    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
