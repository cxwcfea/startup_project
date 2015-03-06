angular.module('myApp').factory('gbCard', ['$resource', function($resource) {
    var CardResource = $resource('/api/cards/:uid', {userID: "@uid"});

    return CardResource;
}]);
