'use strict';
angular.module('futuresApp').controller('FuturesExchangeCtrl', ['$scope', '$window', '$modal', function($scope, $window, $modal) {
    $scope.user = $scope.data.currentUser;

    $scope.profitLevel = [0.1, 0.2, 0.3, 0.4];
    $scope.pointNeeded = ['0-99', '100-399', '400-999', '1000+'];

    $scope.profitLevelIndex = 3;
    if ($scope.user.score <= 99) {
        $scope.profitLevelIndex = 0;
    } else if ($scope.user.score <= 300) {
        $scope.profitLevelIndex = 1;
    } else if ($scope.user.score < 1000) {
        $scope.profitLevelIndex = 2;
    }
    $scope.cash = $scope.user.wechat.profit * $scope.profitLevel[$scope.profitLevelIndex] / 100;
    $scope.scorePercent = $scope.user.score / 1000;
    $scope.percentClass = { width: $scope.scorePercent + '%' };

    var openScoreHintPopup = function (size) {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/score_hint_popup.html',
            controller: 'InfoModalCtrl',
            size: size,
            resolve: {}
        });

        modalInstance.result.then(function () {
            console.log('Modal dismissed at: ' + new Date());
        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.showScoreHint = function() {
        openScoreHintPopup('lg');
    };
}]);