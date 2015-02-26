angular.module('myApp').factory('gbOrder', function($resource) {
    var OrderResource = $resource('/api/orders/:id', {_id: "@id"}, {
        update: {method:'PUT',isArray:false}
    });

    return OrderResource;
});
