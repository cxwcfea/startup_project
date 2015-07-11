'use strict';
angular.module('futuresApp').controller('FuturesUserRankCtrl', ['$scope', '$window', '$location', function($scope, $window, $location) {
    $scope.trade = function() {
        $location.path('/futures');
    }
}]);