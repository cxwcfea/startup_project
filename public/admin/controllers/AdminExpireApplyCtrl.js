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
        vm.sendSMS(apply);
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
}]);
