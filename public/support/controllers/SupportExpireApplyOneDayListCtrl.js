'use strict';
angular.module('supportApp').controller('SupportExpireApplyOneDayListCtrl', ['$scope', '$http', '$location', '$modal', 'gbNotifier', 'days', function($scope, $http, $location, $modal, gbNotifier, days) {
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
        $http.get('/admin/api/applies/expire_in_one_day').success(function(data) {
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
        vm.sendSMS(apply);
    };

    vm.forceCloseApply = function(apply) {
        var modalInstance = $modal.open({
            templateUrl: 'forceCloseModal.html',
            controller: 'forceCloseModalCtrl',
            resolve: {
                apply: function () {
                    return apply;
                }
            }
        });
        modalInstance.result.then(function (trans_id) {
            $http.post('/user/apply_close/' + apply.serialID, {})
                .success(function(data, status, headers, config) {
                    apply.status = 5;
                    gbNotifier.notify('已提交结算');
                })
                .error(function(data, status, headers, config) {
                    gbNotifier.error('结算申请提交失败，请稍后重试');
                });
        }, function () {
        });
    };

    vm.sendSMS = function(apply) {
        var modalInstance = $modal.open({
            templateUrl: '/views/smsModal.html',
            controller: 'SMSModalCtrl',
            resolve: {
                serialID: function () {
                    return apply.serialID;
                }
            }
        });

        modalInstance.result.then(function (content) {
            vm.sms_content = content;
            var data = {
                user_mobile: apply.userMobile,
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

    vm.sendSellSMS = function() {
        gbNotifier.notify('短信发送中...');
        $http.post('/admin/api/send_sell_sms', {})
            .success(function(data, status) {
                gbNotifier.notify('短信已发送');
                console.log('ok');
            })
            .error(function(data, status) {
                console.log('fail');
            });
    }
}]);

angular.module('supportApp').controller('forceCloseModalCtrl', ['$scope', '$modalInstance', 'apply', function ($scope, $modalInstance, apply) {
    $scope.serial_id = apply.serialID;

    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);