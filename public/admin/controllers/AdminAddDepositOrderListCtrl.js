'use strict';
angular.module('adminApp').controller('AdminAddDepositOrderListCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', 'adminApply', function($scope, $location, $routeParams, $modal, $http, gbNotifier, adminApply) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;

    initData();

    function initData() {
        $http.get('/admin/api/orders/add_deposit').success(function(data) {
            order_list = data;
            currentOrders = order_list;
            pageReset();
        });
    }

    function pageReset() {
        vm.totalItems = currentOrders.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentOrders.slice(start, end);
    };

    vm.handleOrder = function(order) {
        adminApply.get({id:order.applySerialID, uid:order.userID}, function(apply) {
            var modalInstance = $modal.open({
                templateUrl: 'homasInfoModal.html',
                controller: 'HomasInfoModalCtrl',
                resolve: {
                    order: function () {
                        return order;
                    },
                    apply: function () {
                        return apply;
                    }
                }
            });
            modalInstance.result.then(function () {
            }, function () {
            });
        });
    };
}]);

angular.module('adminApp').controller('HomasInfoModalCtrl', ['$scope', '$modalInstance', 'order', 'apply', function ($scope, $modalInstance, order, apply) {
    $scope.applySerialID = order.applySerialID;
    $scope.homasAccount = apply.account;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);