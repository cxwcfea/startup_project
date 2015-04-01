angular.module('supportApp').factory('gbUser', ['$resource', function($resource) {
    var UserResource = $resource('/admin/api/users/:id', {id: "@_id"});

    return UserResource;
}]);
