angular.module('adminApp').factory('adminApply', ['$resource', function($resource) {
    var ApplyResource = $resource('/admin/api/user/:uid/applies/:id', {uid: "@userID", id: "@_id"});

    return ApplyResource;
}]);
