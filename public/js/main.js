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

        var count = 0;
        $btn.addClass('am-disabled');
        $btn[0].innerText = '60秒后重试';
        var timeId = setInterval(function() {
            ++count;
            $btn[0].innerText = 60-count + '秒后重试';
            if (count == 60) {
                clearInterval(timeId);
                $btn[0].innerText = '获取验证码';
                $btn.removeClass('am-disabled');
            }
        }, 1000);

        /*
        $btn.button('loading');
        setTimeout(function(){
            $btn.button('reset');
        }, 60000);
        */
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
                var pay_amount = $('#pay_amount')[0].value;
                $.post('/api/users/update_balance', {pay_amount:pay_amount}, function(data) {
                    if (data.success) {
                        var pay_amount = $('#total_amount')[0].value;
                        var apply_id = $('#apply_id')[0].value;
                        $.post('/api/users/pay_by_balance', {pay_amount:pay_amount, apply_id:apply_id}, function(data) {
                            if (data.success) {
                                window.location.replace('/thank_you_for_pay');
                            } else {
                                window.location.replace('/failed_to_pay');
                            }
                        });
                    } else {
                        window.location.replace('/failed_to_pay');
                    }
                });
            },
            onCancel: function() {
                window.location.replace('/support_contact');
            }
        });
    });


    $('#go-to-use-balance').on('click', function(e) {
        e.preventDefault();
        var formData = $("form").serialize();
        $.post("/api/users/pay_by_balance", formData, function (data) {
            if (data.success) {
                window.location.replace('/thank_you_for_pay');
            } else {
                window.location.replace('/failed_to_pay');
            }
        });
    });
});
