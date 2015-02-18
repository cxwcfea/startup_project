angular.module('myApp').factory('gbCard', function($resource) {
    var CardResource = $resource('/api/cards/:uid', {userID: "@uid"});

    return CardResource;
});
