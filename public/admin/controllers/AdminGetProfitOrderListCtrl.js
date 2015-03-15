'use strict';
angular.module('adminApp').controller('AdminGetProfitOrderListCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', 'gbNotifier', 'gbUser', function($scope, $location, $routeParams, $modal, $http, gbNotifier, gbUser) {
    var vm = this;
    var order_list = {};
    var currentOrders;
    vm.itemsPerPage = 15;
    var currentUser = null;

    initData();

    function initData() {
        $http.get('/admin/api/orders/get_profit').success(function(data) {
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
        gbUser.get({id:order.userID}, function(user) {
            currentUser = user;
        });
        var modalInstance = $modal.open({
            templateUrl: 'getProfitModal.html',
            controller: 'GetProfitModalCtrl',
            resolve: {
                order: function () {
                    return order;
                }
            }
        });
        modalInstance.result.then(function (result) {
            order.status = 1;
            $http.post('/admin/api/orders/'+order._id, order)
                .success(function(data, status, headers, config) {
                    currentUser.finance.balance += order.amount;
                    _.remove(order_list, function(o) {
                        return o._id === order._id;
                    });
                    currentOrders = order_list;
                    pageReset();
                    currentUser.$save(function(u) {
                        gbNotifier.notify('更新成功');
                    }, function(err) {
                        console.log(err);
                        console.log(currentUser);
                        currentUser.finance.balance -= order.amount;
                        gbNotifier.error('更新失败:' + err.toString());
                    });
                }).
                error(function(data, status, headers, config) {
                    gbNotifier.error('更新失败:' + data.reason);
                });
            var data = {
                user_mobile: currentUser.mobile,
                sms_content: result.sms_content
            };
            $http.post('/admin/api/send_sms', data)
                .then(function(response) {
                    if (response.data.success) {
                        gbNotifier.notify('短信已发送');
                    } else {
                        gbNotifier.error('短信发送失败:' + response.data.reason);
                    }
                });
        }, function () {
        });
    };
}]);

angular.module('adminApp').controller('GetProfitModalCtrl', ['$scope', '$modalInstance', 'order', 'get_profit_sms_content', function ($scope, $modalInstance, order, get_profit_sms_content) {
    $scope.data = {};
    $scope.applySerialID = order.applySerialID;
    $scope.data.sms_content = get_profit_sms_content;

    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);