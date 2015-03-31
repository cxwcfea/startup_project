angular.module('userApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('userApp').config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/index', { templateUrl: '/user/home',
            controller: 'UserHomeCtrl as homeVM'
        })
        .when('/apply_detail/:serial_id', { templateUrl: '/user/apply_detail',
            controller: 'UserApplyCtrl as applyVM'
        })
        .when('/user_capital', { templateUrl: '/user/user_capital',
            controller: 'UserCapitalCtrl as capitalVM'
        })
        .when('/user_account', { templateUrl: '/user/user_account',
            controller: 'UserAccountCtrl as accountVM'
        })
        .otherwise({
            redirectTo: '/index'
        });
}]);

angular.module('userApp2', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('userApp2').config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/home', { templateUrl: '/user/account_summary',
            controller: 'UserHomeCtrl2 as homeVM'
        })
        /*
        .when('/apply_detail/:serial_id', { templateUrl: '/user/apply_detail',
            controller: 'UserApplyCtrl as applyVM'
        })
        .when('/user_capital', { templateUrl: '/user/user_capital',
            controller: 'UserCapitalCtrl as capitalVM'
        })
        .when('/user_account', { templateUrl: '/user/user_account',
            controller: 'UserAccountCtrl as accountVM'
        })
        */
        .otherwise({
            redirectTo: '/home'
        });
}]);