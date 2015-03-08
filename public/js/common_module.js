angular.module('commonApp', []);

angular.module('commonApp').value('gbToastr', toastr);

angular.module('commonApp').factory('gbNotifier', ['gbToastr', function(gbToastr) {
    return {
        notify: function(msg) {
            gbToastr.success(msg);
            //console.log(msg);
        },
        error: function(msg) {
            gbToastr.error(msg);
            //console.log(msg);
        }
    }
}]);
