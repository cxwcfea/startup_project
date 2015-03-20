angular.module('userApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('userApp').config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/home', { templateUrl: '/new_user/new_home',
            controller: 'UserHomeCtrl as homeVM'
        })
        .otherwise({
            redirectTo: '/home'
        });
}]);