angular.module('myApp', ['ngResource', 'ngRoute']);

angular.module('myApp').config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider
        .when('/user/index', { templateUrl: '/user/home',
            controller: 'UserMainController'
        })
        .when('/user/profile', { templateUrl: '/user/profile',
            controller: 'UserProfileController'
        })
        .otherwise({
            redirectTo: '/'
        });
    /*
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