$(function () {
	//登录
	$(".jq_topLogin").hover(function () {
		$(".jq_LoginBox").show();
		$(this).addClass("TopLoginBoxSelected");
//		$(document).unbind("click", LoginHide);
	}, function () {
		$(".jq_LoginBox").hide();
		$(this).removeClass("TopLoginBoxSelected");
//		$(document).bind("click", LoginHide);
	});
//	function LoginHide() {
//		$(".jq_LoginBox").hide();
//	}

	//头部客户端下载
	$(".jq_khdBox").hover(function () {
		$(this).find("div").show();
		$(this).addClass("khdBoxSelected");
	},function () {
		$(this).find("div").hide();
		$(this).removeClass("khdBoxSelected")
	});

	//登陆框错误提示
	$(".errorText").click(function () {
		$(this).hide();
		$(this).prev("input").focus();
	});
	
	$(".login-btn").click(function () {
		$(".errorText").show();
	});
});



//复制到剪切板
	var lang = new Array(); 
	var userAgent = navigator.userAgent.toLowerCase(); 
	var is_opera = userAgent.indexOf('opera') != -1 && opera.version(); 
	var is_moz = (navigator.product == 'Gecko') && userAgent.substr(userAgent.indexOf('firefox') + 8, 3); 
	var is_ie = (userAgent.indexOf('msie') != -1 && !is_opera) && userAgent.substr(userAgent.indexOf 
	('msie') + 5, 3);

    function copycode1(obj) {
        var a=document.getElementById(obj)
        if(is_ie && a.style.display != 'none') {
            alert('复制成功');
            var rng = document.body.createTextRange();
            rng.moveToElementText(a);
            rng.scrollIntoView();
            rng.select();
            rng.execCommand("Copy");
            rng.collapse(false);
        }else{
            alert("该浏览器不支持此功能，请Ctrl+C复制");
        }
    }