angular.module('applyApp', []);

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

    $('#go-to-pay').on('click', function(e) {
        e.preventDefault();
        window.open('/third_party_pay');
        $('#pay-confirm').modal({
            relatedTarget: this,
            onConfirm: function(options) {
                /*
                var $link = $(this.relatedTarget).prev('a');
                var msg = $link.length ? '你要删除的链接 ID 为 ' + $link.data('id') :
                    '确定了，但不知道要整哪样';
                alert(msg);
                */
                alert('成功');
            },
            onCancel: function() {
                alert('算求，不弄了');
            }
        });
    });

/*
    $('.apply li a').click(function (e) {
        var x = $('.apply li a');
        x.each(function(index, elem) {
            $(elem).removeClass("selected");
        });
        console.log(x);
        $(this).addClass("selected");
    });
*/
    /*
    $('#apply-other-amount').click(function (e) {
        var x = $('.apply li a');
        x.each(function(index, elem) {
            $(elem).removeClass("selected");
        });
    });
    */
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
