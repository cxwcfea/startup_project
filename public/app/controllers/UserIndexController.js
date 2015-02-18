'use strict';
angular.module('myApp').controller('UserIndexController', ['$location', '$http', function($location, $http) {
    var vm = this;

    vm.gotoRoot = function() {
        window.location = '/';
    };

    vm.signout = function() {
        console.log('run index ctrl');
        $http.post('/logout', {logout:true})
            .then(function() {
                window.location = '/';
            });
    };
}]);
