$(document).ready(function() {
    moment.locale('zh-cn');
    $("#forgot-get-verify-code-btn").bind("click", function(e) {
        e.preventDefault();
        console.log("button clicked");
    });
});
