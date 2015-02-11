angular.module('app', ['ngResource', 'ngRoute']);

angular.module('app').config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
        .when('/', { templateUrl: '/partials/landing', controller: 'gbMainCtrl' });
        /*
        .when('/signup', { templateUrl: '/partials/account/signup',
            controller: 'gbSignupCtrl'
        })
        .when('/login', { templateUrl: '/partials/account/login',
            controller: 'gbLoginCtrl'
        })
        .when('/admin/users', { templateUrl: '/partials/admin/user-list',
            controller: 'gbUserListCtrl', resolve: routeRoleChecks.admin
        })
        .when('/funding/applyPay', { templateUrl: '/partials/funding/applyPay',
            controller: 'gbApplyPayCtrl'
        })
        .when('/funding/applyByDay', { templateUrl: '/partials/funding/applyByDay',
            controller: 'gbApplyCtrl'
        });
        */
});