(function ($) {
    $.fn.Carousel = function (options) {
        var defaults = {
            ImgContentID: "ImgContent", //内容ID
            ImgtTextID: "ImgText", //文字ID
            ImgListID: "ImgList", //数量ID
            TopID: "ImgTopBox", //上一张ID
            NextID: "ImgNextBox", //下一张ID
            ImgListClass: "selectLi", //选中状态css
            events: "click", //事件，click为鼠标点击,hover为鼠标滑过
            AutoPlay: true, //自动播放 ，false为不播放
            speed: 1000, //播放速度
            Styles: "default", //移动形式，default为无，Transverse为横向移动,
            mobileSpeed: 500//移动速度
        }
        var options = $.extend(defaults, options);
        this.each(function () {
            var ImgContentBox = $("#" + options.ImgContentID); //内容ID
            var ImgContent = $("#" + options.ImgContentID).find("li"); //内容li
            var ImgText = $("#" + options.ImgtTextID).find("li"); //文字li
            var ImgList = $("#" + options.ImgListID).find("li"); //数量li
            var ImgContentLiLength = ImgContent.length; //内容li数量
            var top = $("#" + options.TopID);
            var next = $("#" + options.NextID);


            var imgVal = 0; //初始值
            var CssHover = options.ImgListClass; //选中状态css
            var events = options.events; //事件
            var AutoPlay = options.AutoPlay; //自动播放
            var styles = options.Styles; //移动形式
            var mobileSpeed = options.mobileSpeed; //移动速度
            var ImgWidth = ImgContent.width();
            var ImgHeight = ImgContent.height();

            $(this).css("position", "relative").css("overflow","hidden");
            ImgContentBox.css({ "position": "absolute", "left": "0", "top": "0" });


            //判断是否自动播放
            if (AutoPlay == true) {
                var speed = setInterval(auto, options.speed); //播放速度
                $(this).hover(function () {
                    clearInterval(speed)
                }, function () {
                    speed = setInterval(auto, options.speed);
                })
            }




            //判断是鼠标事件
            //            ImgList.bind(events, function () {
            //                var index = $(this).index();
            //                Selecteds(index);
            //            })
            if (events == "hover") {
                ImgList.hover(function () {
                    var index = $(this).index();
                    Selecteds(index);
                })
            }
            if (events == "click") {
                ImgList.click(function () {
                    var index = $(this).index();
                    Selecteds(index);
                })
            }
            //判断移动形式为Transverse
            if (styles == "Transverse") {
                ImgContentBox.width(ImgWidth * ImgContentLiLength);
                ImgContent.css("float", "left");
                ImgContent.css("width",ImgContentBox.width()/ImgContentLiLength)
            }
            if (styles == "Fade") {
                ImgContent.css("position", "absolute");
            }
		if (styles == "opa") {
//              ImgContentBox.width(ImgWidth * ImgContentLiLength);
                ImgContent.css("position", "absolute");
                ImgContent.hide();
                ImgContent.eq(0).show();
            }



            //鼠标执行事件
            function Selecteds(index) {

                //判断移动形式为default
                if (styles == "default") {
                    ImgContent.eq(index).show().siblings().hide();
                }

                //判断移动形式为Transverse
                if (styles == "Transverse") {
                    ImgContentBox.stop().animate({ "left": "-" + ImgWidth * index }, mobileSpeed)
                }
                if (styles == "Vertical") {
                    ImgContentBox.stop().animate({ "top": "-" + ImgHeight * index }, mobileSpeed)
                }
				if (styles == "opa") {
//                  ImgContent.eq(imgVal).show().siblings().hide();
					ImgContent.eq(index).fadeIn(mobileSpeed).siblings().stop().fadeOut(mobileSpeed);
                }


                ImgList.eq(index).addClass(CssHover).siblings().removeClass(CssHover);
                ImgText.eq(index).show().siblings().hide();
                imgVal = index;
            }

            //自动播放事件
            function auto() {


                imgVal++;
                if (imgVal > ImgContentLiLength - 1) {
                    imgVal = 0;
                }

                LB()
            }
            //上一张点击事件

            top.click(function () {
                imgVal--;
                if (imgVal < 0) {
                    imgVal = ImgContentLiLength - 1;
                }

                LB()


            })
            next.click(function () {
                imgVal++;
                if (imgVal > ImgContentLiLength - 1) {
                    imgVal = 0;
                }

                LB()


            })
            function LB() {
                //判断移动形式为default
                if (styles == "default") {
                    ImgContent.eq(imgVal).show().siblings().hide();
                }
                if (styles == "opa") {
//                  ImgContent.eq(imgVal).show().siblings().hide();
					ImgContent.eq(imgVal).fadeIn(mobileSpeed).siblings().fadeOut(mobileSpeed);
                }

                //判断移动形式为Transverse
                if (styles == "Transverse") {
                    ImgContentBox.stop().animate({ "left": "-" + ImgWidth * imgVal }, mobileSpeed)
                }
                //判断移动形式为Vertical
                if (styles == "Vertical") {
                    ImgContentBox.stop().animate({ "top": "-" + ImgHeight * imgVal }, mobileSpeed);

                }
                ImgList.eq(imgVal).addClass(CssHover).siblings().removeClass(CssHover);
                ImgText.eq(imgVal).show().siblings().hide();
            }
        })
    }
})(jQuery);