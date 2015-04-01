angular.module('supportApp').factory('supportApply', ['$resource', function($resource) {
    var ApplyResource = $resource('/support/api/user/:uid/applies/:id', {uid: "@userID", id: "@_id"});

    return ApplyResource;
}]);
