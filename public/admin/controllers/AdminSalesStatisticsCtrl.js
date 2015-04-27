'use strict';
angular.module('adminApp').controller('AdminSalesStatisticsCtrl', ['$scope', '$location', '$http', function($scope, $location, $http) {
    var vm = this;
    vm.salesData = {};

    $http.get('/admin/api/sales_statistics').success(function(data) {
        var month = moment().startOf('month').format('YYYYMM');
        vm.salesData = data.filter(function(elem) {
            elem.transRate = elem.newCustomers.length ? (elem.newPayCustomers.length / elem.newCustomers.length * 100) : 0;
            elem.transRate = elem.transRate.toFixed(2);
            return elem.month === month;
        });
    });
}]);