'use strict';
angular.module('adminApp').controller('AdminApplyListCtrl', ['$scope', '$http', '$location', '$routeParams', '$modal', 'adminApply', 'gbNotifier', 'gbUser', 'days', function($scope, $http, $location, $routeParams, $modal, adminApply, gbNotifier, gbUser, days) {
    var vm = this;
    var apply_list = {};
    var currentApplies;
    vm.itemsPerPage = 15;
    var currentUser = $scope.data.selectedUser;

    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/applies/") == 0) {
            var id = $routeParams["uid"];
            initData(id);
        }
    });

    function pageReset() {
        vm.totalItems = currentApplies.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    function initData(id) {
        apply_list = adminApply.query({uid:id}, function () {
            angular.forEach(apply_list, function(value, key) {
                formatData(value);
            });
            currentApplies = apply_list;
            pageReset();
        });

        if (!currentUser) {
            gbUser.get({id:id}, function(user) {
                currentUser = user;
            });
        }

        vm.queryItems = [
            {
                name: '全部',
                value: 0
            },
            {
                name: '待支付',
                value: 1
            },
            {
                name: '当前操盘',
                value: 2
            },
            {
                name: '已结算',
                value: 3
            },
            {
                name: '审核中',
                value: 4
            },
            {
                name: '结算中',
                value: 5
            }
        ];
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

    vm.queryItem = function(item) {
        currentApplies = apply_list.filter(function (elem) {
            if (!item.value) return true;
            return elem.status === item.value;
        });
        pageReset();
    };

    vm.manageApply = function(apply) {
        if (apply.status === 4 || apply.status === 1) {
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
            console.log(content);
            var data = {
                apply: apply
            };
            if (content.account) {
                data.homas = {
                    account: content.account,
                    password: content.password
                }
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
            templateUrl: 'smsModal.html',
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
                user_mobile: currentUser.mobile,
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

    vm.updateApply = function (apply) {
        var modalInstance = $modal.open({
            templateUrl: 'applyUpdateModal.html',
            controller: 'UpdateApplyModalCtrl',
            resolve: {
                apply: function() {
                    return apply;
                }
            }
        });

        modalInstance.result.then(function (result) {
            console.log(result);
            if (result.dt) {
                apply.endTime = result.dt;
                var tradeDays = days.tradeDaysFromEndDay(apply.endTime, apply.period);
                apply.endTime.setHours(14);
                apply.endTime.setMinutes(54);
                apply.endTime.setSeconds(59);
                apply.startTime = moment(result.dt).subtract(tradeDays, 'days').startOf('day').toDate();
            }
            apply.status = Number(result.status);
            apply.$save(function(a) {
                gbNotifier.notify('更新成功');
                formatData(a);
            }, function(e) {
                gbNotifier.error('更新失败');
            });
        }, function () {
        });
    }
}]);

angular.module('adminApp').controller('AccountModalCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
    $scope.ok = function () {
        var result = {
            account: $scope.homas_account,
            password: $scope.homas_password
        };

        $modalInstance.close(result);
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

angular.module('adminApp').controller('UpdateApplyModalCtrl', ['$scope', '$modalInstance', 'apply', function ($scope, $modalInstance, apply) {
    $scope.data = {};
    $scope.data.status = apply.status;
    /*
    $scope.today = function() {
        $scope.data.dt = apply.endTime ? apply.endTime : apply.end_date.toDate();
    };
    $scope.today();
    */

    $scope.clear = function () {
        $scope.data.dt = null;
    };

    $scope.toggleMin = function() {
        $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    // Disable weekend selection
    $scope.disabled = function(date, mode) {
        return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    $scope.open = function($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.opened = true;
    };

    $scope.dateOptions = {
        startingDay: 1
    };

    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
