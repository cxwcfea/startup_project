'use strict';
angular.module('adminApp').controller('AdminExpireApplyCtrl', ['$scope', '$http', '$location', '$modal', 'gbNotifier', 'days', function($scope, $http, $location, $modal, gbNotifier, days) {
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
        $http.get('/admin/api/applies/expire').success(function(data) {
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
        if (apply.status === 4) {
            vm.assignAccount(apply);
        } else if(apply.status === 2) {
            vm.sendSMS(apply);
        }
    };

    vm.assignAccount = function(apply) {
        var modalInstance = $modal.open({
            templateUrl: 'assignAccountModal.html',
            controller: 'AccountModalCtrl',
            resolve: {}
        });

        modalInstance.result.then(function (content) {
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
        }, function () {
        });
    };

    vm.sendSMS = function(apply) {
        var modalInstance = $modal.open({
            templateUrl: 'smsModal.html',
            controller: 'SMSModalCtrl',
            resolve: {
                serialID: function () {
                    return apply.serialID;
                }
            }
        });

        modalInstance.result.then(function (content) {
            if (!$scope.data.selectedUser) {
                gbNotifier.error('用户没找到，请返回用户列表重试');
                return;
            }
            vm.sms_content = content;
            var data = {
                user_mobile: $scope.data.selectedUser.mobile,
                sms_content: vm.sms_content
            };
            console.log(vm.sms_content);
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

/*
angular.module('adminApp').controller('AccountModalCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {

    $scope.ok = function () {
        if ($scope.homas_account && $scope.homas_password) {
            var result = {
                account: $scope.homas_account,
                password: $scope.homas_password
            };

            $modalInstance.close(result);
        } else {
            alert('输入无效');
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('adminApp').controller('SMSModalCtrl', ['$scope', '$modalInstance', 'serialID', function ($scope, $modalInstance, serialID) {
    $scope.sms_content = '您好,您在牛金网的一笔配资【单号:' + serialID + '】,保证金已不足，请补足到保证金的80%。';

    $scope.ok = function () {
        $modalInstance.close($scope.sms_content);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
    */