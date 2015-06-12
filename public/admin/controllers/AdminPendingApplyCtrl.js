'use strict';
angular.module('adminApp').controller('AdminPendingApplyCtrl', ['$scope', '$http', '$location', '$modal', '$filter', 'gbNotifier', 'days', function($scope, $http, $location, $modal, $filter, gbNotifier, days) {
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
        $http.get('/admin/api/applies/pending').success(function(data) {
            apply_list = data;
            apply_list = $filter('orderBy')(apply_list, 'applyAt', true);
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
            templateUrl: '/views/assignAccountModal.html',
            controller: 'AccountModalCtrl',
            resolve: {
                apply: function() {
                    return apply;
                }
            }
        });

        modalInstance.result.then(function (content) {
            var data = {
                apply: apply
            };
            if (content.account) {
                data.homas = {
                    account: content.account,
                    password: content.password
                };
                data.accountType = Number(content.type);
            }
            $http.post('/admin/api/apply/assign_account', data)
                .success(function(data, status, headers, config) {
                    console.log(data);
                    gbNotifier.notify('账户已分配');
                    apply.status = data.apply.status;
                    apply.account = data.apply.account;
                    apply.pasword = data.apply.password;
                }).
                error(function(data, status, headers, config) {
                    gbNotifier.error('分配失败:' + data.reason);
                });
        }, function () {
        });
    };

    vm.sendSMS = function(apply) {
        var modalInstance = $modal.open({
            templateUrl: '/views/smsModal.html',
            controller: 'SMSModalCtrl2',
            resolve: {
                apply: function () {
                    return apply;
                }
            }
        });

        modalInstance.result.then(function (content) {
            vm.sms_content = content;
            var data = {
                user_mobile: apply.userMobile,
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
        });
    };

    vm.cancelApply = function(apply) {
        var modalInstance = $modal.open({
            templateUrl: 'cancelApplyModal.html',
            controller: 'CancelApplyModalCtrl',
            resolve: {
                apply: function () {
                    return apply;
                }
            }
        });

        modalInstance.result.then(function () {
            $http.post('/admin/api/cancel_apply', {applySerialID:apply.serialID})
                .success(function(data, status) {
                    gbNotifier.notify('取消成功');
                    _.remove(apply_list, function(o) {
                        return o._id === apply._id;
                    });
                    currentApplies = apply_list;
                    pageReset();
                })
                .error(function(data, status) {
                    gbNotifier.error('取消失败:' + data.error_msg);
                });
        }, function () {
        });
    };

    vm.showVip = function(vip) {
        if (!vip) {
            currentApplies = apply_list.filter(function (elem) {
                return true;
            });
            pageReset();
            return;
        }
        currentApplies = apply_list.filter(function (elem) {
            return !elem.isTrial;
        });
        pageReset();
    };
}]);

angular.module('adminApp').controller('SMSModalCtrl2', ['$scope', '$modalInstance', 'apply', 'sms_macro', function ($scope, $modalInstance, apply, sms_macro) {
    $scope.show_template = false;
    $scope.sms_content = sms_macro[2].content.replace('AMOUNT', apply.amount).replace('ACCOUNT', apply.account).replace('PASSWORD', apply.password);

    $scope.ok = function () {
        $modalInstance.close($scope.sms_content);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('adminApp').controller('CancelApplyModalCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
