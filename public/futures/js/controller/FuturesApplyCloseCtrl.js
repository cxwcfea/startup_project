'use strict';
angular.module('futuresApp').controller('FuturesApplyCloseCtrl', ['$scope', '$window', '$http', '$modal', '$timeout', function($scope, $window, $http, $modal, $timeout) {
    $scope.user = $scope.data.currentUser;

    var TEXT1 = '申请结算';
    var TEXT2 = '结算已受理，请等待短信通知';
    var buttonEnable = true;
    if ($scope.user.wechat.status === 5) {
        $scope.btn_text = TEXT2;
        buttonEnable = false;
    } else {
        $scope.btn_text = TEXT1;
    }

    function displayError(msg) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
        }, 2000);
    }

    function showCloseApplyPopup() {
        var modalInstance = $modal.open({
            animation: true,
            windowClass: 'xx-dialog',
            templateUrl: 'views/apply_close_popup.html',
            controller: 'InfoModalCtrl',
            size: 'lg',
            resolve: {}
        });

        modalInstance.result.then(function () {
            buttonEnable = false;
            $http.post('/futures/trade_close', {uid:$scope.user._id, user_status:5, trader_status:1})
                .success(function(data, status) {
                    $scope.user.wechat.status = 5;
                    //displayError('结算申请已提交');
                    $scope.btn_text = TEXT2;
                })
                .error(function(data, status) {
                    displayError('结算申请提交失败:' + data.error_msg);
                    buttonEnable = true;
                });
        }, function () {
        });
    }

    $scope.closeApply = function() {
        if (!buttonEnable) return;
        showCloseApplyPopup();
    };
}]);