'use strict';
angular.module('supportApp').controller('SupportApplyListCtrl', ['$scope', '$http', '$location', '$routeParams', '$modal', 'supportApply', 'gbNotifier', 'days', function($scope, $http, $location, $routeParams, $modal, supportApply, gbNotifier, days) {
    var vm = this;
    var apply_list = {};
    var currentApplies;
    vm.itemsPerPage = 15;

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
        apply_list = supportApply.query({uid:id}, function () {
            angular.forEach(apply_list, function(value, key) {
                formatData(value);
            });
            currentApplies = apply_list;
            pageReset();
        });

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

    vm.searchApply = function() {
        if (!vm.searchKey) {
            return;
        }
        vm.currentApplies = [];
        for (var key in vm.apply_list) {
            if (vm.apply_list[key].serialID == vm.searchKey) {
                vm.currentApplies.push(vm.apply_list[key]);
                break;
            }
        }
        vm.totalItems = vm.apply_list.length;
    };

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

    vm.moveApplyToPending = function(apply) {
        $http.post('/admin/change_apply_to_pending', {serial_id:apply.serialID})
            .success(function(data, status) {
                apply.status = 4;
                gbNotifier.notify('更新成功');
            })
            .error(function(data, status) {
                gbNotifier.error(data.error_msg);
            });
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
                }
            }
            $http.post('/support/api/apply/assign_account', data)
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
            $http.post('/support/api/send_sms', data)
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
                var tradeDays = days.tradeDaysTillNow(apply.startTime, apply.period);
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
    };

    vm.addDeposit = function(apply) {
        var modalInstance = $modal.open({
            templateUrl: 'addDepositModal.html',
            controller: 'addDepositModalCtrl',
            resolve: {
                apply: function() {
                    return apply;
                }
            }
        });

        modalInstance.result.then(function (result) {
            console.log(result);
            if (!result.amount) {
                gbNotifier.error('必须输入追加金额');
            }
            $http.post('/apply/add_deposit/' + apply.serialID, {deposit_amount:result.amount})
                .success(function(data, status) {
                    gbNotifier.notify('追加成功');
                })
                .error(function(data, status) {
                    gbNotifier.error('追加失败');
                })
        }, function () {
        });
    }
}]);

angular.module('supportApp').controller('AccountModalCtrl', ['$scope', '$modalInstance', 'apply', function ($scope, $modalInstance, apply) {
    $scope.userMobile = apply.userMobile;
    $scope.homs_password = apply.userMobile.toString().substr(5);

    $scope.ok = function () {
        var result = {
            account: $scope.homs_account,
            password: $scope.homs_password
        };

        $modalInstance.close(result);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('supportApp').controller('SMSModalCtrl', ['$scope', '$modalInstance', 'serialID', function ($scope, $modalInstance, serialID) {
    $scope.sms_content = '您好,您在牛金网的一笔配资【单号:' + serialID + '】,保证金已不足，请补足到保证金的80%。';

    $scope.ok = function () {
        $modalInstance.close($scope.sms_content);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

angular.module('supportApp').controller('addDepositModalCtrl', ['$scope', '$modalInstance', 'apply', function ($scope, $modalInstance, apply) {
    $scope.data = {};
    $scope.apply = apply;

    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
