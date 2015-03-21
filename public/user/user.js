angular.module('userApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('userApp').config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/index', { templateUrl: '/new_user/new_home',
            controller: 'UserHomeCtrl as homeVM'
        })
        .when('/apply_detail/:serial_id', { templateUrl: '/new_user/apply_detail',
            controller: 'UserApplyCtrl as applyVM'
        })
        .when('/user_capital', { templateUrl: '/new_user/user_capital',
            controller: 'UserCapitalCtrl as capitalVM'
        })
        .otherwise({
            redirectTo: '/index'
        });
}]);