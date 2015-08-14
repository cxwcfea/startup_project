'use strict';

angular.module('futuresApp').controller('FuturesTradeSettingCtrl', ['$scope', '$modal', '$http', '$timeout', '$location', function($scope, $modal, $http, $timeout, $location) {
    $scope.user = $scope.data.currentUser;

    function displayError(msg) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
        }, 2000);
    }

    var OPEN_TEXT = '开启设置';
    var CLOSE_TEXT = '关闭设置';

    $scope.titleText = OPEN_TEXT;
    $scope.open = false;
    $scope.changeSetting = function() {
        alert($scope.open);
        /*
        if (!$scope.winPoint) {
            displayError('请输入有效手机号');
            return;
        }
        $http.post('/futures/make_appointment', {mobile:$scope.mobile})
            .success(function(data, status) {
                (function () {
                    var modalInstance = $modal.open({
                        animation: true,
                        backdrop: 'static',
                        windowClass: 'xx-dialog',
                        templateUrl: 'views/appointment_done_popup.html',
                        controller: 'InfoModalCtrl',
                        size: 'lg',
                        resolve: {}
                    });

                    modalInstance.result.then(function () {
                        $location.path('/home');
                    }, function () {
                    });
                })();
            })
            .error(function(data, status) {
                displayError('预约失败');
            });
            */
    };

    $scope.toggleSetting = function() {
        if ($scope.open) {
            $scope.titleText = CLOSE_TEXT;
        } else {
            $scope.titleText = OPEN_TEXT;
        }
    };
}]);