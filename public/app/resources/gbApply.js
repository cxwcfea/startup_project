angular.module('myApp').factory('gbApply', ['$resource', function($resource) {
    var ApplyResource = $resource('/api/applies/:uid/apply/:aid', {userID: "@uid", applyID: "@aid"});

    return ApplyResource;
}]);
