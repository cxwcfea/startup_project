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
	})
});
