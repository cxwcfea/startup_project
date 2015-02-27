angular.module('myApp', ['ngResource', 'ngRoute', 'ui.bootstrap']);

angular.module('myApp').config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
        .when('/user/index', { templateUrl: '/user/home',
            controller: 'UserMainController as homeVM'
        })
        .when('/user/profile', { templateUrl: '/user/profile',
            controller: 'UserProfileController as profileVM'
        })
        .when('/user/orders', { templateUrl: '/user/orders',
            controller: 'UserOrderController as ordersVM'
        })
        .when('/user/security', { templateUrl: '/user/security',
            controller: 'UserSecurityController as securityVM'
        })
        .when('/user/identity', { templateUrl: '/user/identity',
            controller: 'UserIdentityController as identityVM'
        })
        .when('/user/mypay', { templateUrl: '/user/mypay',
            controller: 'UserPayController as mypayVM'
        })
        .when('/user/withdraw', { templateUrl: '/user/withdraw',
            controller: 'UserWithdrawController as withdrawVM'
        })
        .when('/user/verify_email', { templateUrl: '/user/verify_email',
            controller: 'UserEmailController as emailVM'
        })
        .when('/user/change_pass', { templateUrl: '/user/change_pass',
            controller: 'UserResetPasswordController as passVM'
        })
        .otherwise({
            redirectTo: '/user/index'
        });
});
