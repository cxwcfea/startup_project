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
        var name = '我';
        var profit = '';
        if (bootstrappedUserObject) {
            name = bootstrappedUserObject.wechat.wechat_name;
            profit = (bootstrappedUserObject.wechat.trader.lastCash - 100000000)/100;
        }
        wx.onMenuShareAppMessage({
            title: '股指拍拍机',
            desc: name + '玩拍拍机赚了' + profit.toFixed(0) + '，赶紧来PK！',
            link: 'http://www.niujin.cn/futures/',
            imgUrl: 'http://www.niujin.cn/futures/images/logo.png',
            type: 'link',
            dataUrl: '',
            success: function () {

            },
            cancel: function () {

            }
        });

        wx.onMenuShareTimeline({
            title: '拍拍机',
            link: 'http://www.niujin.cn/futures',
            imgUrl: 'http://www.niujin.cn/futures/images/logo.png',
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
	
	window.njPersonChart = function(basic,total) {
		var income = total - basic;
		var pieColor = '#eb6877';
		var chartTitle = '总资产';
		var chartContent1 = '收益:';
		var chartContent2 = '本金:';
		var chartContent2Num = basic;
		var chartTitleNum = total.toFixed(0);
		if (income < 0) {
			income = 0 - income;
			pieColor = '#6fd264';
			chartTitle = '本金';
			chartContent1 = '亏损:';
			chartContent2 = '总资产:';
			chartContent2Num = basic - income;
			chartTitleNum = basic.toFixed(0);
		}
		$('#sectorChart').highcharts({
			chart: {
				plotBackgroundColor: null,
				plotBorderWidth: 0,
				plotShadow: false
			},
			title: {
				text: chartTitleNum + '<br>' + chartTitle,
				align: 'center',
				verticalAlign: 'middle',
				x: 0,
				y: 0,
				style: {
					fontSize:'15'
				}
			},
			tooltip: {
				pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
			},
			plotOptions: {
				pie: {
					dataLabels: {
						enabled: false,
						/*distance: 10,
						style: {
							color: 'black',
						}*/
					},
					startAngle: 0,
					endAngle: 360,
					center: ['50%', '50%'],
					showInLegend: false
				}
			},
			/*legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: 0,
                y: 60,
                borderWidth: 0,
                labelFormatter: function () {
                    return this.name + '&nbsp';
                },
                useHTML: true
            },*/
			series: [{
				type: 'pie',
				name: chartTitle,
				innerSize: '70%',
				data: [
					{
						name:chartContent1+income.toFixed(0),
						color:pieColor,
						y:income
					},
					{
						name:chartContent2+basic.toFixed(0),
						color:'#dfe9eb',
						y:chartContent2Num
					}
				]
			}],
			exporting:{
                enabled:false
            },
            credits: {
                enabled:false
            }
		});
	};
});
