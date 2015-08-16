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

    $scope.showHelp = function() {
        openIntroPopup();
    };

    function openIntroPopup() {
        var modalInstance = $modal.open({
            animation: true,
            backdrop: 'static',
            windowClass: 'xx-dialog',
            templateUrl: 'views/intro_popup.html',
            controller: 'IntroModalCtrl',
            size: 'lg',
            resolve: {}
        });

        modalInstance.result.then(function () {
            console.log('Modal dismissed at: ' + new Date());
            $scope.data.status = 1;
        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

    function showRealTradePopup() {
        var modalInstance = $modal.open({
            animation: true,
            windowClass: 'xx-dialog',
            templateUrl: 'views/real_trade_popup.html',
            controller: 'InfoModalCtrl',
            size: 'lg',
            resolve: {}
        });

        modalInstance.result.then(function () {
            $scope.data.real = true;
            $location.path('/home');
        }, function () {
        });
    }

    $scope.gotoReal = function() {
        if (!$scope.user.identity.id) {
            $location.path('/contract');
        } else {
            showRealTradePopup();
        }
    };
}]);
