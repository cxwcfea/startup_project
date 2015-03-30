$(function () {
    $("#imgFocus").Carousel({
        ImgContentID: "ImgContent", //内容ID;
        ImgListClass: "selectLi", //选中状态css;
        events: "click", //事件，click为鼠标点击,hover为鼠标滑过;
        AutoPlay: true, //自动播放 ，false为不播放;
        speed: 5000, //播放速度;
        Styles: "opa", //移动形式，default为无，Transverse为横向移动,Vertical为纵向,opa透明度渐隐
        mobileSpeed: 500//移动速度;
    });

    /*
     $("#jq_moneyList li").click(function () {
     $(this).addClass("select").siblings().removeClass("select");
     });
     */
    /*
     $("#jq_qtMoney").click(function () {
     $("#jq_qtmoneyBox").show();
     });
     */
    /*
     $("#return_moneyBox").click(function () {
     $("#jq_qtmoneyBox").hide();
     //$("#jq_moneyList li").eq(0).addClass("select").siblings().removeClass("select");
     });
     */

    /*
    $(".jq_loginClose").click(function () {
        $(".loginTcc").hide();
    });
    */

    var speed=80; //数字越大速度越慢
    var tab=document.getElementById("demo");
    var tab1=document.getElementById("demo1");
    var tab2=document.getElementById("demo2");
    tab2.innerHTML=tab1.innerHTML; //克隆demo1为demo2
    function Marquee(){
        if(tab2.offsetTop-tab.scrollTop<=0){//当滚动至demo1与demo2交界时
            tab.scrollTop-=tab1.offsetHeight; //demo跳到最顶端
        }
        else{
            tab.scrollTop++;
        }
    }
    var MyMar=setInterval(Marquee,speed);
    tab.onmouseover=function() {clearInterval(MyMar)};//鼠标移上时清除定时器达到滚动停止的目的
    tab.onmouseout=function() {MyMar=setInterval(Marquee,speed)};//鼠标移开时重设定时器
});
