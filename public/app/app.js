angular.module('myApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('myApp').config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
    //$locationProvider.html5Mode(true);

    // Initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    // Disable IE ajax request caching
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

    $routeProvider
        .when('/index', { templateUrl: '/user/home',
            controller: 'UserMainController as homeVM'
        })
        .when('/profile', { templateUrl: '/user/profile',
            controller: 'UserProfileController as profileVM'
        })
        .when('/orders', { templateUrl: '/user/orders',
            controller: 'UserOrderController as ordersVM'
        })
        .when('/security', { templateUrl: '/user/security',
            controller: 'UserSecurityController as securityVM'
        })
        .when('/identity', { templateUrl: '/user/identity',
            controller: 'UserIdentityController as identityVM'
        })
        .when('/mypay', { templateUrl: '/user/mypay',
            controller: 'UserPayController as mypayVM'
        })
        .when('/withdraw', { templateUrl: '/user/withdraw',
            controller: 'UserWithdrawController as withdrawVM'
        })
        .when('/verify_email', { templateUrl: '/user/verify_email',
            controller: 'UserEmailController as emailVM'
        })
        .when('/change_pass', { templateUrl: '/user/change_pass',
            controller: 'UserResetPasswordController as passVM'
        })
        .when('/change_finance_pass', { templateUrl: '/user/change_finance_pass',
            controller: 'UserResetPasswordController as passVM'
        })
        .when('/apply_list', { templateUrl: '/user/apply_list',
            controller: 'UserApplyListController as applyVM'
        })
        .otherwise({
            redirectTo: '/index'
        });
}]);
