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
            if (count === 60) {
                clearInterval(timeId);
                $btn[0].innerText = '获取验证码';
                $btn.removeClass('am-disabled');
            }
        }, 1000);

        var requestData = {
            mobile: mobile.trim()
        };
        $.get("/api/send_sms_verify_code", requestData, function (data) {
            console.log(data);
        });
    });

    window.aibeiNotify = function(data) {
        console.log("RetCode=" + data.RetCode+":TransId=" + data.TransId + ":OrderStatus=" + data.OrderStatus);
        if (data.RetCode === 0) {
            console.log('pay complete');
            if (data.OrderStatus === 0) {
                console.log('pay success');
                var apply_id = $('#apply_id')[0] ? $('#apply_id')[0].value : null;
                if (window.niujin_data && window.niujin_data.paying_order) {
                    var order_id = window.niujin_data.paying_order.id;
                    var pay_amount = window.niujin_data.paying_order.price;
                    window.niujin_data.paying_order = null;
                    $.post('/api/users/pay_success/' + order_id, {pay_amount:pay_amount}, function(data) {
                        if (data.success) {
                            if (apply_id) {
                                $.post('/api/users/pay_by_balance', {pay_amount:pay_amount, apply_id:apply_id}, function(data) {
                                    if (data.success) {
                                        //window.location.replace('/thank_you_for_pay');
                                        console.log('success to pay for apply')
                                    } else {
                                        console.log('failed to pay for apply')
                                        //window.location.replace('/failed_to_pay');
                                    }
                                });
                            } else {
                                //window.location.replace('/thank_you_for_pay');
                                console.log('pay success');
                            }
                        } else {
                            console.log('failed to update user balance after pay success');
                            //window.location.replace('/failed_to_pay');
                        }
                    });
                }
            } else {
                console.log('pay failed');
            }
        }

    };

    function showPayWindow(trans_id) {
        $.aibei_mask({
            tip : 'loading'
        });
        $.aibei_showIframePayWindow(trans_id, 'window.aibeiNotify');
        $.aibei_unmask();

        $('#pay-confirm').modal({
            relatedTarget: this,
            onConfirm: function (options) {
                var apply_id = $('#apply_id')[0] ? $('#apply_id')[0].value : null;
                if (apply_id) {
                    window.location.replace('/thank_you_for_pay?apply_id=' + apply_id);
                } else {
                    window.location.replace('/thank_you_for_pay');
                }
            },
            onCancel: function () {
                window.location.replace('/support_contact');
            }
        });
    }

    function getTransId(order_id, user_id, pay_amount) {
        var trans_id = $('#trans_id')[0] ? $('#trans_id')[0].value : null;
        var data = {
            id: order_id,
            uid: user_id,
            price: pay_amount
        };

        window.niujin_data = {};
        window.niujin_data.paying_order = data;

        if (trans_id) {
            showPayWindow(trans_id);
            return;
        }
        $.post('/api/user_pay', data, function(data) {
            if (data.success) {
                console.log(data.transid);
                showPayWindow(data.transid);
            } else {
                console.log('error');
            }
        });
    }

    function placeOrder(uid, pay_amount, apply_id) {
        var order = {
            userID: uid,
            dealType: '充值',
            amount: pay_amount,
            description: '股票配资'
        };
        $.ajax({
            url : "/api/user/" + uid + "/orders?aid=" + apply_id,
            type : 'POST',
            dataType : 'json',
            data: order,
            success : function(response) {
                console.log(response._id);
                getTransId(response._id, uid, pay_amount);
            },
            error : function(e) {
                console.log(e);
            }
        });
    }


    function payByShengpay() {
        console.log('payByShengpay');
        var Name = $('#Name')[0].value;
        var Version = $('#Version')[0].value;
        var Charset = $('#Charset')[0].value;
        var MsgSender = $('#MsgSender')[0].value;
        var OrderNo = $('#OrderNo')[0].value;
        var OrderAmount = $('#OrderAmount')[0].value;
        var OrderTime = $('#OrderTime')[0].value;
        var PageUrl = $('#PageUrl')[0].value;
        var BackUrl = $('#BackUrl')[0].value;
        var NotifyUrl = $('#NotifyUrl')[0].value;
        var BuyerIp = returnCitySN["cip"];
        var ProductName = $('#ProductName')[0].value;
        var Ext1 = $('#Ext1')[0].value;
        var SignType = $('#SignType')[0].value;
        var md5Key = 'shengfutongSHENGFUTONGtest';


        var sign_origin = Name+Version+Charset+MsgSender+OrderNo+OrderAmount+OrderTime+
                PageUrl+BackUrl+NotifyUrl+ProductName+BuyerIp+Ext1+SignType+md5Key;
        var SignMsg = SparkMD5.hash(sign_origin);
        SignMsg = SignMsg.toUpperCase();
        console.log(SignMsg);

        $('#BuyerIp')[0].value = BuyerIp;
        $('#SignMsg')[0].value = SignMsg;

        $('#shengPayForm')[0].submit();
    }

    $('#go-to-pay').on('click', function(e) {
        e.preventDefault();
        var uid = $('#user_id')[0].value;
        var pay_amount = $('#pay_amount')[0].value;
        var apply_id = $('#apply_id')[0] ? $('#apply_id')[0].value : null;
        var order_id = $('#order_id')[0] ? $('#order_id')[0].value : null;

        var pay_option = $('#pay-select')[0].value;
        console.log('pay option:' + pay_option);
        if (pay_option === 'option1') {
            payByShengpay();
            return;
        }

        if (order_id) {
            getTransId(order_id, uid, pay_amount);
        } else {
            placeOrder(uid, pay_amount, apply_id);
        }
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
