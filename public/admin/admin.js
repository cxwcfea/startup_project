angular.module('adminApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('adminApp').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    //$locationProvider.html5Mode(true);
    $routeProvider
        .when('/users', { templateUrl: '/admin/user_list',
            controller: 'AdminUserListCtrl as userVM'
        })
        .when('/applies/:uid', { templateUrl: '/admin/apply_list',
            controller: 'AdminApplyListCtrl as applyVM'
        })
        .otherwise({
            redirectTo: '/users'
        });
}]);