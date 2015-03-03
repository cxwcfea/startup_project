$(document).ready(function() {
    moment.locale('zh-cn');

    $('.verify-code-btn').click(function () {
        var $btn = $(this);

        var mobile = $("#mobile")[0].value;
        if (!mobile || mobile.search(/1[3|5|7|8|][0-9]{9}$/) !== 0) {
            //alert('请输入正确的手机号码');
            $('#correct-mobile-alert').modal({});
            return;
        }

        $btn.button('loading');
        setTimeout(function(){
            $btn.button('reset');
        }, 60000);
        var requestData = {
            mobile: mobile.trim()
        };
        $.get("/api/send_sms_verify_code", requestData, function (data) {
            console.log(data);
        });
    });

    /*
    $("#signup-verify-code-btn").bind("click", function(e) {
        e.preventDefault();
        console.log("button clicked");
        var $btn = $(this);
        $btn.button('loading');
        setTimeout(function(){
            $btn.button('reset');
        }, 60000);
        var mobile = $("#mobile_num")[0].value;
        mobile = mobile.trim();
        console.log(mobile);
        if (!mobile || mobile.search(/1[3|5|7|8|][0-9]{9}$/) != 0) {
            $('#mobile_num').popover({
                content: 'not valid mobile'
            });
            return;
        }
    });
     */
});
