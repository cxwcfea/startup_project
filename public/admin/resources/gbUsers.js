angular.module('adminApp').factory('gbUser', ['$resource', function($resource) {
    var UserResource = $resource('/admin/api/users/:id', {id: "@uid"});

    return UserResource;
}]);
