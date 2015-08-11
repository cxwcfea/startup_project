angular.module('adminApp', ['ngResource', 'ngRoute', 'ui.bootstrap', 'commonApp']);

angular.module('adminApp').config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
    // Initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    // Disable IE ajax request caching
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

    //$locationProvider.html5Mode(true);
    $routeProvider
        .when('/users', { templateUrl: '/admin/user_list',
            controller: 'AdminUserListCtrl as userVM'
        })
        .when('/applies/:uid', { templateUrl: '/admin/apply_list',
            controller: 'AdminApplyListCtrl as applyVM'
        })
        .when('/orders/:uid', { templateUrl: '/admin/order_list',
            controller: 'AdminOrderListCtrl as orderVM'
        })
        .when('/one_day_expire_apply', { templateUrl: '/admin/apply_expire_in_one_day',
            controller: 'AdminExpireApplyCtrl as expireApplyVM'
        })
        .when('/closing_applies', { templateUrl: '/admin/closing_apply_list',
            controller: 'AdminClosingApplyCtrl as closingApplyVM'
        })
        .when('/get_profit_orders', { templateUrl: '/admin/get_profit_order_list',
            controller: 'AdminGetProfitOrderListCtrl as profitOrderListVM'
        })
        .when('/add_deposit_orders', { templateUrl: '/admin/add_deposit_order_list',
            controller: 'AdminAddDepositOrderListCtrl as addDepositOrderListVM'
        })
        .when('/pending_applies', { templateUrl: '/admin/pending_apply_list',
            controller: 'AdminPendingApplyCtrl as pendingApplyVM'
        })
        .when('/withdraw_orders', { templateUrl: '/admin/withdraw_order_list',
            controller: 'AdminWithdrawOrderCtrl as withdrawOrderVM'
        })
        .when('/waiting_confirm_withdraw_order_list', { templateUrl: '/admin/waiting_confirm_withdraw_order_list',
            controller: 'AdminWaitingCompleteWithdrawOrderCtrl as vm'
        })
        .when('/alipay_orders', { templateUrl: '/admin/alipay_order_list',
            controller: 'AdminAlipayOrderListCtrl as alipayOrderListVM'
        })
        .when('/my_users', { templateUrl: '/admin/my_user_list',
            controller: 'AdminMyUserListCtrl as myUserVM'
        })
        .when('/recharge_orders', { templateUrl: '/admin/recharge_order_list',
            controller: 'AdminRechargeOrderListCtrl as rechargeOrderVM'
        })
        .when('/orders', { templateUrl: '/admin/orders',
            controller: 'AdminOrderCtrl as orderVM'
        })
        .when('/orders_of_alipay', { templateUrl: '/admin/order_list_of_alipay',
            controller: 'AdminOrderListOfAlipayCtrl as vm'
        })
        .when('/statistics', { templateUrl: '/admin/statistics'
        })
        .when('/sales_statistics', { templateUrl: '/admin/sales_statistics',
            controller: 'AdminSalesStatisticsCtrl as vm'
        })
        .when('/user_page', { templateUrl: '/admin/user_page',
            controller: 'AdminUserCtrl as vm'
        })
        .when('/return_fee_orders', { templateUrl: '/admin/return_fee_order_list',
            controller: 'AdminReturnFeeOrderListCtrl as vm'
        })
        .when('/user_complain_list', { templateUrl: '/admin/user_complain_list',
            controller: 'AdminUserComplainListCtrl as vm'
        })
        .when('/freeze_withdraw', { templateUrl: '/admin/freeze_withdraw_order_list',
            controller: 'AdminFreezeWithdrawOrderListCtrl as vm'
        })
        .when('/contract_list', { templateUrl: '/admin/contract_list',
            controller: 'AdminContractListCtrl'
        })
        .when('/loss_apply_list', { templateUrl: '/admin/loss_apply_list',
            controller: 'AdminLossApplyListCtrl as vm'
        })
        .when('/ppj_user_list', { templateUrl: '/admin/ppj_user_list',
            controller: 'AdminPPJUserListCtrl'
        })
        .when('/appoint_user_list', { templateUrl: '/admin/appoint_user_list',
            controller: 'AdminAppointUserListCtrl'
        })
        .when('/ppj_trade_user_list', { templateUrl: '/admin/ppj_trade_user_list',
            controller: 'AdminPPJTradeUserCtrl'
        })
        .otherwise({
            redirectTo: '/users'
        });
}]);
