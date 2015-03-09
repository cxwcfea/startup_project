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

angular.module('commonApp').filter("displayDate", function () {
    return function (input) {
        return moment(input).format("YYYY-MM-DD HH:mm");
    };
}).filter("orderStatus", function() {
    return function (input) {
        if (input) {
            return '交易成功';
        } else {
            return '等待确认';
        }
    };
});