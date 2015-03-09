'use strict';
angular.module('adminApp').controller('AdminUserListCtrl', ['$scope', '$http', '$modal', '$location', 'gbUser', 'gbNotifier', function($scope, $http, $modal, $location, gbUser, gbNotifier) {
    var vm = this;
    vm.users = gbUser.query(function() {
        vm.showAllUsers();
    });

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.currentUsers = vm.users.slice(start, end);
    };

    vm.registerDate = function(date) {
        return moment(date).format("YYYY-MM-DD HH:mm");
    };

    vm.showAllUsers = function() {
        vm.totalItems = vm.users.length;
        vm.currentPage = 1;
        vm.itemsPerPage = 15;
        vm.pageChanged();
    };

    vm.searchUser = function() {
        if (!vm.searchKey) {
            return;
        }
        vm.currentUsers = [];
        for (var key in vm.users) {
            if (vm.users[key].mobile == vm.searchKey) {
                vm.currentUsers.push(vm.users[key]);
                break;
            }
        }
        vm.totalItems = vm.currentUsers.length;
    };

    vm.showApplies = function(user) {
        $scope.data.selectedUser = user;
        $location.path('/applies/' + user._id);
    };

    vm.showOrders = function(user) {
        $scope.data.selectedUser = user;
        $location.path('/orders/' + user._id);
    };

    vm.open = function (mobile) {

        var modalInstance = $modal.open({
            templateUrl: 'smsModal.html',
            controller: 'ModalInstanceCtrl',
            //size: size,
            resolve: {}
        });

        modalInstance.result.then(function (content) {
            vm.sms_content = content;
            var data = {
                user_mobile: mobile,
                sms_content: vm.sms_content
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
            //console.log('Modal dismissed at: ' + new Date());
        });
    };
}]);

angular.module('adminApp').controller('ModalInstanceCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.sms_content = '您好，我是您在牛金网的专属客服XX。QQ:xxxxxx 微信:xxxxxx 如果您有任何问题都可以24小时随时咨询。牛金网感谢您对我们的支持，祝您股市大赚!';

    $scope.ok = function () {
        $modalInstance.close($scope.sms_content);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
