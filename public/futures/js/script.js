/**
 * @file script
 * @author xctk
 */



$(function () {
    /**
     * parseURL
     * @param  {string} url
     * @return {object}
     */
    var parseURL = function (url){
        var urlStr = url || window.location.search,
            param = {};

        if(urlStr){
            var urlArr = urlStr.split("?")[1].split("&");

            for (var i = urlArr.length - 1; i >= 0; i--){
                var tempArr = urlArr[i].split("=");
                param[tempArr[0]] = tempArr[1];
            }
        }

        return param;
    };

    /**
     * formatCurrency
     * @param  {number} num
     * @return {number}
     */
    var formatCurrency = function (num) {
        num = num.toString().replace(/\$|\,/g, '');
        if (isNaN(num)) {
            num = "0";
        }
        sign = (num == (num = Math.abs(num)));
        num = Math.floor(num*100 + 0.50000000001);
        cents = num%100;
        num = Math.floor(num/100).toString();
        if ( cents < 10) {
            cents = "0" + cents;
            for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++) {
                num = num.substring(0,num.length-(4*i+3))+','+
                num.substring(num.length-(4*i+3));
            }
        }
        if (cents == '00') {
            return (((sign)?'':'-') + num);
        }
        return (((sign)?'':'-') + num + '.' + cents);
    };

    // tab
    $('#J_switchBtn').on('click', 'span', function (e){
        var $btnBox = $('#J_btns');

        console.log($(this).text().indexOf('3'))
        if($(this).text().indexOf('3') > -1) {
            $btnBox.addClass('three').removeClass('five');
        } else {
            $btnBox.addClass('five').removeClass('three');
        }

        $(this).siblings().removeClass('cur');
        $(this).addClass('cur');
    });

    //$('input[type="range"]').range();

    // chart
    window.njDrawChart = function() {
        if (document.getElementById("J_chart")) {
            var ctx = document.getElementById("J_chart").getContext("2d");
            var data = {
                labels: ["06/26", "06/29", "06/30", "07/01", "07/02", "07/03"],
                datasets: [
                    {
                        label: "",
                        fillColor: "rgba(151,187,205,0.2)",
                        strokeColor: "rgba(151,187,205,1)",
                        pointColor: "rgba(151,187,205,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(151,187,205,1)",
                        data: [4188.57, 4040.48, 4053.70, 4182.93, 4023.93, 3872.15]
                    }
                ]
            };
            new Chart(ctx).Line(data, {
                responsive: true
            });
        }
    };

    Highcharts.setOptions({
        global : {
            useUTC : false
        },
        lang: {
            months: ['一月', '二月', '三月', '四月', '五月', '六月',  '七月', '八月', '九月', '十月', '十一月', '十二月'],
            shortMonths: ['一月', '二月', '三月', '四月', '五月', '六月',  '七月', '八月', '九月', '十月', '十一月', '十二月'],
            weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

        }
    });

    /*
    wx.config({
        debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId: 'wx182b3688b9b060f7', // 必填，公众号的唯一标识
        timestamp: Date.now(), // 必填，生成签名的时间戳
        nonceStr: '', // 必填，生成签名的随机串
        signature: '',// 必填，签名，见附录1
        jsApiList: [] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
    });
    */

});
