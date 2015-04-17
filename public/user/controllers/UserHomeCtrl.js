'use strict';
angular.module('userApp').controller('UserHomeCtrl', ['$scope', '$window', '$filter', 'njApply', 'days', function($scope, $window, $filter, njApply, days) {
    var vm = this;
    $scope.data.menu = 1;

    vm.user = $scope.data.currentUser;

    var apply_list = {};
    vm.currentApplies;

    var profit_rate = 0;

    initData();

    function drawRateChart() {
        var nj_canvas = document.getElementById("canvas");
        if (nj_canvas.getContext){
            var ctx = nj_canvas.getContext("2d");
            var W = nj_canvas.width;
            var H = nj_canvas.height;
            var new_deg=0,dif=0;
            var loop,re_loop;
            var text,text_w;
        }
        function init(num){
            var num01 = 100/num;
            var num02 = 360/num01;
            var deg =num02;
            ctx.clearRect(0,0,W,H);
            ctx.beginPath();
            ctx.strokeStyle="#c3c3c3";
            ctx.lineWidth=2;
            ctx.arc(W/2,H/2,72,0,Math.PI*2,false);
            ctx.stroke();

            var r = deg*Math.PI/180;
            ctx.beginPath();
            ctx.strokeStyle = "#e0322d";
            ctx.lineWidth=2;
            ctx.arc(W/2,H/2,72,0-90*Math.PI/180,r-90*Math.PI/180,false);
            ctx.stroke();

            ctx.fillStyle="#f00";
            ctx.font="50px '微软雅黑'";
            text = Math.floor(deg/360*100)+"%";
            text_w = ctx.measureText(text).width;
            ctx.fillText(text,W/2 - text_w/2,H/2+23);
        }
        if (nj_canvas.getContext){
            init(Number(profit_rate));//数值参数
        }
    }

    function initData() {
        apply_list = njApply.query({uid:vm.user._id}, function () {
            if (apply_list.length > 0) {
                vm.newUser = false;
            } else {
                vm.newUser = true;
            }
            angular.forEach(apply_list, function(value, key) {
                formatData(value);
            });
            vm.currentApplies = $filter('filter')(apply_list, {status: 1}, true);
            if (vm.currentApplies.length === 0) {
                vm.currentApplies = $filter('filter')(apply_list, {status: 2}, true);
            }
            if (vm.currentApplies.length === 0) {
                vm.currentApplies = $filter('filter')(apply_list, {status: 4}, true);
            }
            if (vm.currentApplies.length === 0) {
                vm.currentApplies = $filter('filter')(apply_list, {status: 5}, true);
            }
            if (vm.currentApplies.length === 0) {
                vm.currentApplies = $filter('filter')(apply_list, {status: 3}, true);
            }
        });
        if (vm.user.finance.history_deposit > 0) {
            profit_rate = vm.user.finance.profit / vm.user.finance.history_deposit * 100;
        }
        drawRateChart();
    }

    function formatData (item) {
        item.start_date = item.startTime ? item.startTime : days.startTime();
        item.end_date = item.endTime ? item.endTime : days.endTime(item.start_date, item.period);
    }
}]);
