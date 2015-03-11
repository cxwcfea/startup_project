angular.module('myApp').factory('gbOrder', ['$resource', function($resource) {
    var OrderResource = $resource('/api/user/:uid/orders/:id', {uid:"@userID", id:"@_id"});

    return OrderResource;
}]);
