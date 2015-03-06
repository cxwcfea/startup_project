angular.module('myApp').factory('gbOrder', ['$resource', function($resource) {
    var OrderResource = $resource('/api/orders/:id', {_id: "@id"}, {
        update: {method:'PUT',isArray:false}
    });

    return OrderResource;
}]);
