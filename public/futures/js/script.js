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

    wx.ready(function(){
        //alert('wechat sign success');
        wx.onMenuShareAppMessage({
            title: '快来玩股指拍拍机',
            desc: '拍拍机是模拟股指期货交易的小游戏',
            link: 'http://test2.niujinwang.com/futures/',
            imgUrl: 'http://test2.niujinwang.com/futures/images/logo.png',
            type: 'link',
            dataUrl: '',
            success: function () {

            },
            cancel: function () {

            }
        });

        wx.onMenuShareTimeline({
            title: '拍拍机',
            link: 'http://test2.niujinwang.com',
            imgUrl: 'http://test2.niujinwang.com/futures/images/logo.png',
            success: function () {

            },
            cancel: function () {

            }
        });
    });

    wx.error(function(res){
        //alert('wechat sign error:' + res.errMsg);
    });

    var currentUrl = location.href.split('#')[0];
    $.get("/wechat/get_jsapi_token?url=" + encodeURIComponent(currentUrl), function() {
        //console.log( "get jsapi token done" );
    })
    .done(function(data) {
        wx.config(data);
    })
    .fail(function(data, text) {
        //alert('fail');
    })
    .always(function() {
    });

	window.njPersonChart = function() {
		$('#container').highcharts({
			chart: {
				plotBackgroundColor: null,
				plotBorderWidth: 0,
				plotShadow: false
			},
			title: {
				text: 'Browser'+'<br>总资产',
				align: 'center',
				verticalAlign: 'middle',
				y: 0
			},
			tooltip: {
				pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
			},
			plotOptions: {
				pie: {
					dataLabels: {
						enabled: true,
						distance: -50,
						style: {
							fontWeight: 'bold',
							color: 'white',
							textShadow: '0px 1px 2px black'
						}
					},
					startAngle: 0,
					endAngle: 360,
					center: ['50%', '50%']
				}
			},
			series: [{
				type: 'pie',
				name: 'Browser share',
				innerSize: '70%',
				data: [
					['收益', 12345.00],
					['本金', 2612345.00],
					['亏损', 0.00]
				]
			}]
		});
	};
});
