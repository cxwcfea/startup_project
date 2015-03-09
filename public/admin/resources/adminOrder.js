angular.module('adminApp').factory('adminOrder', ['$resource', function($resource) {
    var OrderResource = $resource('/admin/api/user/:uid/orders/:id', {uid: "@userID", id: "@_id"});

    return OrderResource;
}]);
