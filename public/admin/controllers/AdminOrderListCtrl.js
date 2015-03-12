'use strict';
angular.module('adminApp').controller('AdminOrderListCtrl', ['$scope', '$location', '$routeParams', '$modal', 'adminOrder', function($scope, $location, $routeParams, $modal, adminOrder) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;

    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/orders/") == 0) {
            var id = $routeParams["uid"];
            initData(id);
        }
    });

    function initData(id) {
        order_list = adminOrder.query({uid:id}, function () {
            currentOrders = order_list;
            pageReset();
        });

        vm.queryItems = [
            {
                name: '全部',
                value: 0
            },
            {
                name: '充值',
                value: 1
            },
            {
                name: '提现',
                value: 2
            }
        ];
    }

    function pageReset() {
        vm.totalItems = currentOrders.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.queryItem = function (item) {
        currentOrders = order_list.filter(function (elem) {
            if (item.value === 1) {
                return elem.dealType === '充值';
            }
            if (item.value === 2) {
                return elem.dealType === '提现';
            }
            return true;
        });
        pageReset();
    };

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentOrders.slice(start, end);
    };


    vm.handleWithdraw = function(order) {
        var modalInstance = $modal.open({
            templateUrl: 'withdrawModal.html',
            controller: 'WithdrawModalCtrl',
            resolve: {}
        });

        modalInstance.result.then(function (content) {
            apply.$save(function(data) {
                gbNotifier.notify('更新成功!');
            }, function(response) {
                console.log(response);
                gbNotifier.error('更新失败:');
            });
        }, function () {
        });
    };
}]);

angular.module('adminApp').controller('WithdrawModalCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    //$scope.sms_content = '您好,您在牛金网的一笔配资【单号:' + serialID + '】,保证金已不足，请补足到保证金的80%。';

    $scope.ok = function () {
        $modalInstance.close($scope.sms_content);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);