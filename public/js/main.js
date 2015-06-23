$(document).ready(function() {
    moment.locale('zh-cn');

    $('#verify-code-btn').click(function () {
        var $btn = $(this);

        var mobile = $("#mobile")[0].value;
        if (!mobile || mobile.search(/1[3|5|7|8|][0-9]{9}$/) !== 0) {
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
        $.get("/api/send_sms_verify_code", requestData, function (data) {});
    });

    function getTransId(order_id, user_id, pay_amount) {
        var trans_id = $('#trans_id')[0] ? $('#trans_id')[0].value : null;
        var data = {
            id: order_id,
            uid: user_id,
            price: pay_amount
        };

        if (trans_id) {
            showPayWindow(trans_id);
        } else {
            $.post('/user/iapp_pay', data, function(data) {
                if (data.success) {
                    console.log(data.transid);
                    showPayWindow(data.transid);
                } else {
                    console.log('error');
                }
            });
        }
    }

    // pay_type 0 means iapppay, 1 means shengpay
    function placeOrder(uid, pay_amount, apply_id, pay_type) {
        var order = {
            userID: uid,
            dealType: 1,
            amount: pay_amount,
            applySerialID: apply_id,
            description: '股票配资'
        };
        $.ajax({
            url : "/api/user/" + uid + "/orders?aid=" + apply_id,
            type : 'POST',
            dataType : 'json',
            data: order,
            success : function(order) {
                if (pay_type === 1) {
                    payByShengpay(order._id);
                } else {
                    getTransId(order._id, uid, pay_amount);
                }
            },
            error : function(e) {
                console.log(e);
            }
        });
    }

    $('#get-profit').on('click', function(e) {
        e.preventDefault();
        var apply_serial_id = $('#apply_serial_id')[0].value;
        window.location.assign('/apply/get_profit/' + apply_serial_id);
    });

    var form_options = {
        onValid: function(validity) {
        },
        onInValid: function(validity) {
            $('#get-profit-btn').popover({
                content: '请输入有效的金额'
            });
            $('#add-deposit-btn').popover({
                content: '请输入有效的金额'
            });
            $('#apply-postpone-btn').popover({
                content: '请输入有效的天数'
            });
            $('#signup-submit-btn').popover({
                content: '请检查输入，确保手机号正确，且密码长度符合标准'
            });
            $('#login-btn').popover({
                content: '请确保手机号正确，且密码长度符合标准'
            });
        }
    };

    /*
    $('#get-profit-form').validator(form_options);

    $('#add-deposit-form').validator(form_options);

    $('#signup-form').validator(form_options);

    $('#login-form').validator(form_options);
    */

    $('#add-deposit').on('click', function(e) {
        e.preventDefault();
        var apply_serial_id = $('#apply_serial_id')[0].value;
        window.location.assign('/apply/add_deposit/' + apply_serial_id);
    });

    $('#apply-postpone').on('click', function(e) {
        e.preventDefault();
        var apply_serial_id = $('#apply_serial_id')[0].value;
        window.location.assign('/apply/apply_postpone/' + apply_serial_id);
    });


    function closeApply() {
        var apply_serial_id = $('#apply_serial_id')[0].innerText;
        $.post("/user/apply_close/"+apply_serial_id, {}, function() {
            console.log( "close apply done" );
        })
        .done(function() {
            console.log( "close apply success" );
            window.location.assign('/apply_detail/' + apply_serial_id);
        })
        .fail(function() {
            console.log( "close apply error" );
            $(".jq_jsBox03").show();
        })
        .always(function() {
            console.log( "close apply finished" );
            $(".jq_jsBox02").hide();
        });
    }

    //关闭弹出层
    $(".jq_loginClose").click(function () {
        $(".jq_recTcc").hide();
    });

    //我要结算弹出层
    $(".jq_jsBtn02").click(function (e) {
        e.preventDefault();
        $(".jq_jsBox").show();
    });
    //我要结算第一步
    $(".jq_jsBtn01").click(function (e) {
        e.preventDefault();
        $(".jq_jsBox01").hide();
        $(".jq_jsBox02").show();
    });
    $(".jq_jsBtn03").click(function (e) {
        e.preventDefault();
        closeApply();
    });

    //补充保证金弹出层
    $(".jq_bcbzjBtn").click(function (e) {
        e.preventDefault();
        $(".jq_bzbzj").show();
    });
    //补充保证金下一步
    $(".jq_btn01").click(function (e) {
        e.preventDefault();
        if (window.niujin_adding_deposit) {
            alert('正在处理中，请稍侯');
            return;
        }
        var apply_serial_id = $('#apply_serial_id')[0].innerText;
        var amount = Number($("#add_deposit_input")[0].value);
        if (amount <= 0) {
            alert('请输入有效的金额，金额大于0元');
            return;
        }
        window.niujin_adding_deposit = true;
        $.post("/apply/add_deposit/"+apply_serial_id, {deposit_amount:amount}, function() {
            console.log( "post add deposit done" );
            window.niujin_adding_deposit = false;
        })
        .done(function(data) {
            if (data.paid) {
                $(".jq_bzbzjbox_success").show();
            } else {
                window.open('/recharge?order_id=' + data.order._id);
                $(".jq_bzbzjbox").show();
            }
        })
        .fail(function(data) {
            console.log(data);
            $(".jq_bzbzjbox_fail").show();
        })
        .always(function() {
            $(".jq_bzbzjbox2").hide();
        });
    });
    //补充保证金第二步
    $(".jq_btn02").click(function (e) {
        e.preventDefault();
        $(".jq_bzbzjbox").hide();
        $(".jq_bzbzjbox3").show();
    });
    //补充保证金失败
    $(".jq_btn_fail").click(function(e) {
        $(".jq_bzbzjbox_fail").hide();
    });


    //我要延期弹出层
    $(".jq_yqBtn03").click(function (e) {
        e.preventDefault();
        $(".jq_yqBox").show();
    });

    //我要延期下一步
    $(".jq_yzBtn01").click(function (e) {
        e.preventDefault();
        var period = Number($("#postpone_input")[0].value);
        if (period <= 0 || period > 22) {
            alert('请输入有效的日期，日期大于1小于23');
            return;
        }
        var apply_serial_id = $('#apply_serial_id')[0].innerText;
        $.post("/apply/apply_postpone/"+apply_serial_id, {period:period}, function() {
            console.log( "post postpone done" );
        })
        .done(function(data) {
            if (data.paid) {
                $(".jq_yqBox_success").show();
            } else {
                window.open('/recharge?order_id=' + data.order._id);
                $(".jq_yqBox02").show();
            }
        })
        .fail(function(data, text) {
            if (data.status === 403) {
                console.log(JSON.parse(data.responseText).error_msg);
            }
            $(".jq_yqBox_fail").show();
        })
        .always(function() {
            $(".jq_yqBox01").hide();
        });
    });
    //我要延期第二步
    $(".jq_yqBtn02").click(function (e) {
        e.preventDefault();
        $(".jq_yqBox02").hide();
        $(".jq_yqBox03").show();
    });
    $(".jq_yqFinishRecharge").click(function (e) {
        $(".jq_yqBox03").hide();
        $(".jq_yqBox02").hide();
        //$(".jq_yqBox").hide();
    });

    //提取盈利弹出层
    $(".jq_tqylBtn03").click(function (e) {
        e.preventDefault();
        $(".jq_tqylBox").show();
    });
    //提取盈利第一步
    $(".jq_tqylBtn01").click(function (e) {
        e.preventDefault();
        $(".jq_tqylBox01").hide();
        $(".jq_tqylBox02").show();
    });
    //提取盈利第二步
    $(".jq_tqylBtn02").click(function (e) {
        e.preventDefault();
        var amount = Number($("#get_profit_input")[0].value);
        if (amount < 1) {
            alert('请输入有效的金额，最少1元');
            return;
        }
        var apply_serial_id = $('#apply_serial_id')[0].innerText;
        $.post("/apply/get_profit/" + apply_serial_id, {amount:amount}, function() {
            console.log( "post get profit done" );
        })
        .done(function(data) {
            $(".jq_tqylBox03").show();
        })
        .fail(function(data, text) {
            $(".jq_tqylBox_fail").show();
        })
        .always(function() {
            $(".jq_tqylBox02").hide();
        });
    });


});
