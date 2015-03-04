angular.module('myApp').factory('gbApply', function($resource) {
    var ApplyResource = $resource('/api/applies/:uid/apply/:aid', {userID: "@uid", applyID: "@aid"});

    return ApplyResource;
});
