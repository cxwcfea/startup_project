angular.module('userApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('userApp').config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    // Initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    // Disable IE ajax request caching
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

    $routeProvider
        .when('/home', { templateUrl: '/user/account_summary',
            controller: 'UserHomeCtrl as homeVM'
        })
        .when('/recharge', { templateUrl: '/user/recharge',
            controller: 'UserRechargeCtrl as rechargeVM'
        })
        .when('/applies', { templateUrl: '/user/apply_list',
            controller: 'UserApplyListCtrl as applyVM'
        })
        .when('/settings', { templateUrl: '/user/account_setting',
            controller: 'UserAccountCtrl as accountVM'
        })
        .when('/add_card', { templateUrl: '/user/add_card',
            controller: 'UserCardCtrl as cardVM'
        })
        .when('/withdraw', { templateUrl: '/user/withdraw',
            controller: 'UserWithdrawCtrl as withdrawVM'
        })
        .when('/orders', { templateUrl: '/user/order_list',
            controller: 'UserOrderListCtrl as orderVM'
        })
        .otherwise({
            redirectTo: '/applies'
        });
}]);