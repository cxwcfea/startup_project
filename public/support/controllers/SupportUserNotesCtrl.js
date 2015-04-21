'use strict';
angular.module('supportApp').controller('SupportUserNotesCtrl', ['$scope', '$location', '$routeParams', '$modal', '$http', '$resource', 'supportOrder', 'gbNotifier', 'gbUser', function($scope, $location, $routeParams, $modal, $http, $resource, supportOrder, gbNotifier, gbUser) {
    var vm = this;
    var note_list = {};
    var currentNotes;
    vm.itemsPerPage = 15;
    var currentUser = $scope.data.selectedUser;

    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/user_notes/") == 0) {
            var mobile = $routeParams["mobile"];
            initData(mobile);
        }
    });

    function initData(mobile) {
        vm.user = currentUser;
        var NotesResource = $resource('/admin/api/fetch_user_notes/:mobile', {});
        note_list = NotesResource.query({mobile:mobile}, function () {
            currentNotes = note_list;
            console.log(currentNotes.length);
            pageReset();
        });

        /*
        if (!currentUser) {
            gbUser.get({id:id}, function(user) {
                currentUser = user;
            });
        }
        */
    }

    function pageReset() {
        vm.totalItems = currentNotes.length;
        vm.currentPage = 1;
        vm.pageChanged();
    }

    vm.queryItem = function (item) {
        currentNotes = note_list.filter(function (elem) {
            if (!item.value) return true;
            return elem.dealType === item.value;
        });
        pageReset();
    };

    vm.pageChanged = function() {
        var start = (vm.currentPage - 1) * vm.itemsPerPage;
        var end = start + vm.itemsPerPage;
        if (end > vm.totalItems) {
            end = vm.totalItems;
        }
        vm.showingItems = currentNotes.slice(start, end);
    };

    vm.handleOrder = function(order) {
        if (order.dealType === 2) {
            var modalInstance = $modal.open({
                templateUrl: '/views/withdrawModal.html',
                controller: 'WithdrawModalCtrl',
                resolve: {
                    order: function () {
                        return order;
                    }
                }
            });

            modalInstance.result.then(function (result) {
                if (!result.bank_trans_id) {
                    gbNotifier.error('必须输入银行单号！');
                    return;
                }
                order.bankTransID = result.bank_trans_id;
                order.status = 1;
                order.$save(function(o) {
                    currentUser.finance.freeze_capital -= order.amount;
                    currentUser.$save(function(u) {
                        gbNotifier.notify('更新成功');
                    }, function(err) {
                        gbNotifier.error('更新失败:' + err.toString());
                    });
                }, function(err) {
                    gbNotifier.error('更新失败:' + err.toString());
                });
                var data = {
                    user_mobile: currentUser.mobile,
                    sms_content: result.sms_content
                };
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
        }
    };
}]);

angular.module('supportApp').controller('WithdrawModalCtrl', ['$scope', '$modalInstance', 'order', 'sms_macro', function ($scope, $modalInstance, order, sms_macro) {
    $scope.data = {};
    $scope.bank = order.cardInfo.bank;
    $scope.bankName = order.cardInfo.bankName;
    $scope.cardID = order.cardInfo.cardID;
    $scope.userName = order.cardInfo.userName;
    $scope.data.sms_content = sms_macro[7].content.replace('AMOUNT', order.amount);

    $scope.ok = function () {
        $modalInstance.close($scope.data);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);