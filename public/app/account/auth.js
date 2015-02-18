angular.module('myApp').factory('gbIdentity', ['$window', function($window) {
    var currentUser;
    if (!!$window.bootstrappedUserObject) {
        currentUser = {};
        angular.extend(currentUser, $window.bootstrappedUserObject);
    }
    return {
        currentUser: currentUser
    }
}]);
