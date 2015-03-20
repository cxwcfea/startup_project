angular.module('userApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('userApp').config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', { templateUrl: '/new_user/new_home',
            controller: 'UserHomeCtrl as homeVM'
        })
        .when('/apply_detail/:serial_id', { templateUrl: '/new_user/apply_detail',
            controller: 'UserApplyCtrl as applyVM'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);