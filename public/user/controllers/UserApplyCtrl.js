'use strict';
angular.module('userApp').controller('UserApplyCtrl', ['$scope', '$window', '$location', '$routeParams', 'njApply', function($scope, $window, $location, $routeParams, njApply) {
    var vm = this;
    $('.footer').addClass('marTop200');

    vm.currentApply = {};
    $scope.$on("$routeChangeSuccess", function () {
        if ($location.path().indexOf("/apply_detail/") == 0) {
            var serial_id = $routeParams["serial_id"];
            console.log(serial_id);
            njApply.get({uid:$scope.data.currentUser._id, serial_id:serial_id}, function(apply) {
                vm.currentApply = apply;
                formatApply(vm.currentApply);
            })
        }
    });

    function formatApply(item) {
        item.start_date = item.startTime ? item.startTime : days.startTime();
        item.end_date = item.endTime ? item.endTime : days.endTime(item.start_date, item.period);
    }

}]);