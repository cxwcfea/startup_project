$(function () {
	//登录
$(".jq_topLogin").hover(function () {
	$(".jq_LoginBox").show();

	$(document).unbind("click", LoginHide);
}, function () {
	$(document).bind("click", LoginHide);
});
function LoginHide() {
	$(".jq_LoginBox").hide();
}
});
