'use strict';
angular.module('futuresApp').controller('FuturesApplyCloseCtrl', ['$scope', '$window', '$http', '$modal', function($scope, $window, $http, $modal) {
    $scope.user = $scope.data.currentUser;

    var TEXT1 = '申请结算';
    var TEXT2 = '结算已受理，请等待短信通知';
    $scope.btn_text = TEXT1;

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
            $scope.btn_text = TEXT2;
        }, function () {
        });
    }

    $scope.closeApply = function() {
        showCloseApplyPopup();
    };
}]);