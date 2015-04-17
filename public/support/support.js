angular.module('supportApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('supportApp').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    //$locationProvider.html5Mode(true);
    $routeProvider
        .when('/users', { templateUrl: '/support/user_list',
            controller: 'SupportUserListCtrl as userVM'
        })
        .when('/applies/:uid', { templateUrl: '/support/apply_list',
            controller: 'SupportApplyListCtrl as applyVM'
        })
        .when('/orders/:uid', { templateUrl: '/support/order_list',
            controller: 'SupportOrderListCtrl as orderVM'
        })
        .when('/applies', { templateUrl: '/support/applies',
            controller: 'SupportApplyCtrl as applyVM'
        })
        .when('/orders', { templateUrl: '/support/orders',
            controller: 'SupportOrderCtrl as orderVM'
        })
        .when('/add_deposit_orders', { templateUrl: '/support/add_deposit_order_list',
            controller: 'SupportAddDepositOrderListCtrl as addDepositOrderListVM'
        })
        .when('/my_users', { templateUrl: '/support/my_user_list',
            controller: 'SupportMyUserListCtrl as myUserVM'
        })
        .when('/my_applies', { templateUrl: '/support/my_applies',
            controller: 'SupportMyApplyListCtrl as myApplyVM'
        })
        .when('/my_orders', { templateUrl: '/support/my_orders',
            controller: 'SupportMyOrderListCtrl as myOrderVM'
        })
        .when('/expire_applies_in_one_day', { templateUrl: '/support/expire_applies_in_one_day',
            controller: 'SupportExpireApplyOneDayListCtrl as vm'
        })
        .otherwise({
            redirectTo: '/users'
        });
}]);
