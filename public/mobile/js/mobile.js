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
        .when('/invest', { templateUrl: '/mobile/invest',
            controller: 'MobileInvestCtrl as vm'
        })
        .when('/recharge', { templateUrl: '/mobile/recharge'
        })
        .when('/withdraw', { templateUrl: '/mobile/withdraw', 
            controller: 'MobileWithdrawCtrl as withdrawVM'
        })
        .when('/download', { templateUrl: '/mobile/download'
        })
        .when('/recharge_beifu', { templateUrl: '/mobile/recharge_beifu',
            controller: 'MobileRechargeCtrl as vm'
        })
        .when('/login', { templateUrl: '/mobile/login',
            controller: 'MobileLoginCtrl as vm'
        })
        .when('/login_longterm', { templateUrl: '/mobile/login_longterm',
            controller: 'MobileLoginLongtermCtrl as vm'
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
        .when('/yyn', { templateUrl: '/mobile/yyn',
            controller: 'MobileYynCtrl as vm'
        })
        .when('/yyn_confirm/:apply_serial_id', { templateUrl: function(params){ return '/mobile/yyn_confirm/' + params.apply_serial_id; },
            controller: 'MobileYynConfirmCtrl as vm'
        })
        .when('/forget', { templateUrl: '/mobile/forget',
            controller: 'MobileForgetCtrl as vm'
        })
        .when('/change_pass', { templateUrl: '/mobile/change_password',
            controller: 'MobileChangePassCtrl as vm'
        })
        .when('/user', { templateUrl: '/mobile/user',
            controller: 'MobileUserCtrl as vm'
        })
        .when('/account', { templateUrl: '/mobile/account',
            controller: 'MobileUserCtrl as vm'
        })
        .when('/recharge_bank', { templateUrl: '/mobile/recharge_bank',
            controller: 'MobileRechargeCtrl as vm'
        })
        .when('/recharge_alipay', { templateUrl: function(params) { return params.order_id ? '/mobile/recharge_alipay?order_id=' + params.order_id : '/mobile/recharge_alipay'; },
            controller: 'MobileRechargeCtrl as vm'
        })
        .when('/recharge_record', { templateUrl: '/mobile/recharge_record',
            controller: 'MobileRechargeRecordCtrl as vm'
        })
        .when('/user_ttn', { templateUrl: '/mobile/user_ttn',
            controller: 'MobileApplyListCtrl as vm'
        })
        .when('/user_yyn', { templateUrl: '/mobile/user_yyn',
            controller: 'MobileApplyListCtrl as vm'
        })
        .when('/user_ttn_info/:apply_serial_id', { templateUrl: function(params) { return '/mobile/user_ttn_info/' + params.apply_serial_id; },
            controller: 'MobileApplyDetailCtrl as vm'
        })
        .when('/add_deposit', { templateUrl: '/mobile/add_deposit',
            controller: 'MobileAddDepositCtrl as vm'
        })
        .when('/postpone_apply', { templateUrl: '/mobile/postpone_apply',
            controller: 'MobilePostponeCtrl as vm'
        })
        .when('/invest_recharge', { templateUrl: '/mobile/invest_recharge',
            controller: 'MobileInvestRechargeCtrl as vm'
        })
        .when('/invest_list', { templateUrl: '/mobile/invest_list',
            controller: 'MobileInvestListCtrl as vm'
        })
        .when('/order_list', { templateUrl: '/mobile/user_order_list',
            controller: 'MobileUserOrdersCtrl as vm'
        })
        .when('/user_invest_center', { templateUrl: '/mobile/user_invest_center',
            controller: 'MobileUserInvestCenterCtrl as vm'
		})
        .when('/user_promote', { templateUrl: '/mobile/user_promote',
            controller: 'MobileUserPromoteCtrl as vm'
        })
        .when('/weixin_band', { templateUrl: function(params) { return params.w ? '/mobile/weixin_band?w=' + params.w : '/mobile/weixin_band'; },
            controller: 'MobileWeixinBandCtrl as vm'
        })
        .when('/add_card', { templateUrl: '/mobile/add_card',
            controller: 'MobileAddCardCtrl as vm'
		})
        .when('/identity', { templateUrl: '/mobile/identity',
            controller: 'MobileIdentityCtrl'
        })
        .when('/invest_setting', { templateUrl: '/mobile/invest_setting',
            controller: 'MobileInvestSettingCtrl as vm'
        })
        .when('/recharge_yeepay', { templateUrl: '/mobile/recharge_yeepay',
            controller: 'MobileRechargeCtrl as vm'
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
