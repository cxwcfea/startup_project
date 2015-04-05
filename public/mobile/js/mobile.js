angular.module('mobileApp', ['ngResource', 'ngRoute', 'commonApp']);

angular.module('mobileApp').config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    // Initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    // Disable IE ajax request caching
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

    $routeProvider
        .when('/home', { templateUrl: '/mobile/home',
            controller: 'MobileHomeCtrl as vm'
        })
        .when('/exp', { templateUrl: '/mobile/exp'
        })
        .when('/login', { templateUrl: '/mobile/login',
            controller: 'MobileLoginCtrl as vm'
        })
        .when('/signup', { templateUrl: '/mobile/signup',
            controller: 'MobileSignupCtrl as vm'
        })
        .when('/ttn', { templateUrl: '/mobile/ttn',
            controller: 'MobileTtnCtrl as vm'
        })
        .when('/ttn_confirm/:apply_serial_id', { templateUrl: function(params){ return '/mobile/ttn_confirm/' + params.apply_serial_id; },
            controller: 'MobileTtnConfirmCtrl as vm'
        })
        .when('/forget', { templateUrl: '/mobile/forget',
            controller: 'MobileForgetCtrl as vm'
        })
        .when('/user', { templateUrl: '/mobile/user',
            controller: 'MobileUserCtrl as vm'
        })
        .when('/account', { templateUrl: '/mobile/account',
            controller: 'MobileUserCtrl as vm'
        })
        .otherwise({
            redirectTo: '/home'
        });
}]);

/*
angular.module('mobileApp').factory('njIdentity', function($window) {
    var currentUser;
    if (!!$window.bootstrappedUserObject) {
        currentUser = {};
        angular.extend(currentUser, $window.bootstrappedUserObject);
    }
    return {
        currentUser: currentUser,
        isAuthenticated: function() {
            return !!this.currentUser;
        }
    }
});
*/
