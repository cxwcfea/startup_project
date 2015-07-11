'use strict';
angular.module('futuresApp').controller('FuturesExchangeCtrl', ['$scope', '$window', '$modal', function($scope, $window, $modal) {
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