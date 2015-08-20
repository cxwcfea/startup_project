'use strict';
angular.module('futuresApp').controller('FuturesUserCtrl', ['$scope', '$window', '$http', '$location', '$timeout', '$modal', function($scope, $window, $http, $location, $timeout, $modal) {
    $scope.user = $scope.data.currentUser;
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
        balance = $scope.data.deposit;
    }
    if (balance < 0) {
        balance = 0;
    }
    $window.njPersonChart($scope.data.deposit, balance);
    var delta = balance - $scope.data.deposit;
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
