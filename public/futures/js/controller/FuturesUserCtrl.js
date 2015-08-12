'use strict';
angular.module('futuresApp').controller('FuturesUserCtrl', ['$scope', '$window', '$http', '$location', '$timeout', '$modal', function($scope, $window, $http, $location, $timeout, $modal) {
    $scope.user = $scope.data.currentUser;
    $scope.originCapital = 30000;
	$scope.data.selectedItem = 3;

    function displayError(msg) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
        }, 2000);
    }

    var balance = $scope.data.balance;
    if (!balance) {
        balance = 0;
    }
    $window.njPersonChart($scope.originCapital, balance);
    var delta = balance - $scope.originCapital;
    $scope.profit = delta > 0 ? delta : 0;
    $scope.loss = delta < 0 ? delta : 0;
    /*
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
    */

    $scope.showOrders = function() {
        $location.path('/orders');
    };

    $scope.showUserInfo = function() {
        $location.path('/user_info');
    };

    $scope.showApplyClose = function() {
        $location.path('/apply_close');
    };

    $scope.showContract = function() {
        $location.path('/contract');
    };

    function showRealTradePopup() {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/real_trade_popup.html',
            controller: 'InfoModalCtrl',
            size: 'lg',
            resolve: {}
        });

        modalInstance.result.then(function () {
        }, function () {
        });
    }

    $scope.gotoReal = function() {
        if (!$scope.user.identity.id) {
            $location.path('/contract');
        } else {
            $scope.data.real = true;
            showRealTradePopup();
        }
    };
}]);
