'use strict';
angular.module('myApp').controller('UserSecurityController', ['gbIdentity', function(gbIdentity) {
    var vm = this;
    vm.user = gbIdentity.currentUser;

    initData();

    function initData() {
        vm.securityObjects = [
            {
                class: "am-icon-user-secret am-icon-lg",
                title: "实名认证",
                status: vm.user.identity.id ? "已认证" : "未认证",
                url: "/user#/identity",
                action: "去认证",
                show: vm.user.identity.id ? false : true
            },
            {
                class: "am-icon-mobile am-icon-lg",
                title: "绑定手机",
                status: "已认证",
                url: "#",
                action: "修改",
                show: false
            },
            {
                class: "am-icon-envelope am-icon-lg",
                title: "验证邮箱",
                status: vm.user.profile.email_verified ? "已验证" : "未验证",
                url: "/user#/verify_email",
                action: "去验证",
                show: vm.user.profile.email_verified ? false : true
            },
            {
                class: "am-icon-key am-icon-lg",
                title: "登录密码",
                status: "已设置",
                url: "/user#/change_pass",
                action: "修改",
                show: true
            },
            {
                class: "am-icon-money am-icon-lg",
                title: "提现密码",
                status: vm.user.finance.password ? "已设置" : "未设置",
                url: "/user#/change_finance_pass",
                action: vm.user.finance.password ? "修改" : "设置",
                show: true
            }
        ];
    }
}]);
