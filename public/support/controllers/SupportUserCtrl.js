'use strict';
angular.module('supportApp').controller('SupportUserCtrl', ['$scope', '$http', '$modal', '$location', 'gbUser', 'gbNotifier', '$filter', function($scope, $http, $modal, $location, gbUser, gbNotifier, $filter) {
    var vm = this;
    if ($scope.data.searchKey) {
        vm.searchKey = $scope.data.searchKey;
    }

    vm.registerDate = function(date) {
        return moment(date).format("YYYY-MM-DD HH:mm");
    };

    vm.searchUser = function() {
        if (!vm.searchKey) {
            return;
        }
        $scope.data.searchKey = vm.searchKey;
        $http.get('/admin/api/user?mobile=' + vm.searchKey)
            .success(function(data, status) {
                vm.user = data;
            })
            .error(function(data, status) {
                gbNotifier.error('失败:' + data.error_msg);
            });
    };

    vm.showApplies = function() {
        $scope.data.selectedUser = vm.user;
        $location.path('/applies/' + vm.user._id);
    };

    vm.showOrders = function() {
        $scope.data.selectedUser = vm.user;
        $location.path('/orders/' + vm.user._id);
    };

    vm.takeCustomer = function() {
        $http.post('/admin/api/take_customer', {userMobile:vm.user.mobile})
            .success(function(data, status) {
                vm.user.manager = data.manager;
                gbNotifier.notify('更新成功!');
            })
            .error(function(data, status) {
                gbNotifier.error('更新失败! ' + data.error_msg);
            });
    };

    vm.takeNote = function() {
        var modalInstance = $modal.open({
            templateUrl: 'views/takeNoteModal.html',
            controller: 'TakeNoteModalCtrl',
            //size: size,
            resolve: {}
        });

        modalInstance.result.then(function (result) {
            if (result && (result.title || result.tag)) {
                result.mobile = vm.user.mobile;
                $http.post('/admin/api/create_user_note', result)
                    .success(function(data, status) {
                        gbNotifier.notify('创建成功');
                    })
                    .error(function(data, status) {
                        gbNotifier.error('创建失败');
                    });
            } else {
                gbNotifier.error('无效的数据，重新输入！');
            }
        }, function () {
        });
    };

    vm.viewUserNotes = function() {
        $scope.data.selectedUser = vm.user;
        $location.path('/user_notes/' + vm.user.mobile);
    };

    vm.releaseCustomer = function() {
        $http.post('/admin/api/release_customer', {userMobile:vm.user.mobile})
            .success(function(data, status) {
                vm.user.manager = null;
                gbNotifier.notify('更新成功!');
            })
            .error(function(data, status) {
                gbNotifier.error('更新失败! ' + data.error_msg);
            });
    };
}]);