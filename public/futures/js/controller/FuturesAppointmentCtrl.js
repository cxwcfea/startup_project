'use strict';
angular.module('futuresApp').controller('FuturesAppointmentCtrl', ['$scope', '$window', '$http', '$timeout', '$location', function($scope, $window, $http, $timeout, $location) {
    $scope.user = $scope.data.currentUser;

    function displayError(msg) {
        $scope.errorMsg = msg;
        $scope.showError = true;
        $timeout(function() {
            $scope.showError = false;
        }, 2000);
    }

    $scope.appoint = function() {
        if (!$scope.mobile) {
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
    };
}]);