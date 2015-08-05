'use strict';
angular.module('futuresApp').controller('FuturesUserCtrl', ['$scope', '$window', '$http', '$location', '$timeout', function($scope, $window, $http, $location, $timeout) {
    $scope.user = $scope.data.currentUser;
    $scope.originCapital = 1000000;
	$scope.data.selectedItem = 3;

    function displayError(msg) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
        }, 2000);
    }

    $http.get('/api/futures/user_info')
        .success(function(data, status) {
            $window.njPersonChart($scope.originCapital, (data.lastCash/100));
            if (!data.lastCash) {
                $scope.profit = 0;
                $scope.loss = 0;
            } else {
                var delta = data.lastCash/100 - $scope.originCapital;
                $scope.profit = delta > 0 ? delta : 0;
                $scope.loss = delta < 0 ? delta : 0;
            }
        })
        .error(function(data, status) {
            alert('load user info error');
        });

    $scope.showOrders = function() {
        $location.path('/orders');
    };

    $scope.resetCapital = function() {
        /*
        $http.get('/futures/reset_user')
            .success(function(data, status) {
                displayError('重置成功');
            })
            .error(function(data, status) {
                displayError(data.error_msg);
            });
            */
        openRiskPopup();
    };

    var openRiskPopup = function () {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/reset_confirm_popup.html',
            controller: 'InfoModalCtrl',
            size: 'lg',
            resolve: {}
        });

        modalInstance.result.then(function () {
            //console.log('ok at: ' + new Date());
            alert('ok');
        }, function () {
            //console.log('cancel at: ' + new Date());
            alert('cancel');
        });
    };
}]);