angular.module('supportApp').factory('supportOrder', ['$resource', function($resource) {
    var OrderResource = $resource('/support/api/user/:uid/orders/:id', {uid: "@userID", id: "@_id"});

    return OrderResource;
}]);
