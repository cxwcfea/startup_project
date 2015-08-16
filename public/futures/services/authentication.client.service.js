'use strict';

angular.module('futuresApp').factory('Authentication', ['$window',
    function($window) {
        var auth = {
            user: $window.bootstrappedUserObject
        };

        return auth;
    }
]);