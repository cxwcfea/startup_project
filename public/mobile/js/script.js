/**
 * @file script
 * @author xctk
 */



$(function () {
    // accordion
    $('.accordion-heading').click(function () {
        var $this = $(this);

        if ($this.hasClass('on')) {
            $this.removeClass('on');
            $this.next('.accordion-body').hide();
        }else{
            $this.addClass('on').siblings().removeClass('on');
            $('.accordion-body').hide();
            $this.next('.accordion-body').show();
        }
    }).eq(0).click();


    /**
     * parseURL
     * @param  {string} url
     * @return {object}
     */
    var parseURL = function (url){
        var urlStr = url || window.location.search,
            param = {};

        if(urlStr){
            var urlArr = urlStr.split("?")[1].split("&");

            for (var i = urlArr.length - 1; i >= 0; i--){
                var tempArr = urlArr[i].split("=");
                param[tempArr[0]] = tempArr[1];
            }
        }

        return param;
    };

    /**
     * formatCurrency
     * @param  {number} num
     * @return {number}
     */
    var formatCurrency = function (num) {
        num = num.toString().replace(/\$|\,/g, '');
        if (isNaN(num)) {
            num = "0";
        }
        sign = (num == (num = Math.abs(num)));
        num = Math.floor(num*100 + 0.50000000001);
        cents = num%100;
        num = Math.floor(num/100).toString();
        if ( cents < 10) {
            cents = "0" + cents;
            for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++) {
                num = num.substring(0,num.length-(4*i+3))+','+
                num.substring(num.length-(4*i+3));
            }
        }
        if (cents == '00') {
            return (((sign)?'':'-') + num);
        }
        return (((sign)?'':'-') + num + '.' + cents);
    };

    /**
     * delay
     * @param  {Function} fn   [description]
     * @param  {[type]}   time [description]
     * @return {[type]}
     */
    var delay = function (fn, time) {
        var timer = null;

        return (function (){
            if (timer) {
                clearTimeout(timer);
            };
            timer = setTimeout(function () {
                fn && fn();
            }, time);
        })();
    };

    /**
     * sendMobileVerify 发送验证码
     * @param  {string} mobile [description]
     *
     * @param  {number} type   [description]
     *                         type: 1 means 注册，2 means 重置密码
     * @return
     */
    var sendMobileVerify = function (mobile, type) {
        $.get('/api/send_sms_verify_code?mobile=' + mobile + '&type=' + type, function (response){
        });
    }


    /**
     * ttn.html
     * money select
     */
    var setMoneyNum = function (num){

        // 保证金：总金额的1/10
        var $bond = $('#J_bond');
        // 管理费：每1万收19.9
        var $fee = $('#J_fee');
        // 总金额
        var $total = $('#J_total');
        // 警戒线：总金额的96%
        var $warn = $('#J_warn');
        // 平仓线：总金额的94%
        var $out = $('#J_out');

        var $btn2confirm = $('#J_2confirm');

        if (num != '0.00') {
            $bond.text(formatCurrency(num*0.1));
            $fee.text(formatCurrency(num*19.9/10000));
            $total.text(num);
            $warn.text(formatCurrency(num*0.96));
            $out.text(formatCurrency(num*0.94));

            $btn2confirm.attr('href', $btn2confirm.attr('href').replace(/money=\w+$/g, 'money=' + num));
        } else {
            $bond.text(num);
            $fee.text(num);
            $total.text(num);
            $warn.text(num);
            $out.text(num);

            $btn2confirm.attr('href').replace(/money=\w+$/g, 'money=2000');
        }

    };

    $('.money-select li').click(function (e) {
        var $box = $('#J_money');
        var $otherBox = $('#J_other');
        var $this = $(e.target);
        var num = $this.attr('data-num');

        if (num) {
            $this.addClass('current').siblings().removeClass('current');
            setMoneyNum(num);

            return;
        }

        $otherBox.removeClass('hide');
        $box.addClass('hide');

        setMoneyNum('0.00');
    });
    $('#J_back').click(function () {

        $('#J_other').addClass('hide');
        $('#J_money').removeClass('hide');
    });
    $('#J_custNum').on('keyup', function () {
        var num = $(this).val();

        if (num >= 2000 && num <= 300000) {
            $('#J_submit').removeAttr('disabled');
        } else {
            $('#J_submit').attr('disabled', '');
            setMoneyNum('0.00');
        }
    });
    $('#J_moneyform').submit(function (e) {
        e.preventDefault();

        var num = $('#J_custNum').val();

        if (num >= 2000 && num <= 300000) {
            setMoneyNum(num);
        } else {
            setMoneyNum('0.00');
        }
    });

    /**
     * 天天牛-支付确定页面
     */



    /**
     * 登录&注册&找回密码
     */

    // 登录
    $('#J_loginForm').submit(function (e) {
        e.preventDefault();

        var $loginMobile = $('#J_loginMobile');
        var $loginPwd = $('#J_loginPassword');
        var $loginSubmitBtn = $('#J_loginSubmitBtn');
        var $loginTip = $('#J_loginTip');


        var mobile = $.trim($loginMobile.val());
        var password = $.trim($loginPwd.val());


        if (mobile == '' || password == '') {
            $loginTip.text('账号或密码不能为空').removeClass('hide');

            delay(function () {
                $loginTip.addClass('hide');
            }, 1500);

            return;
        };

        $.ajax({
            type: 'POST',
            url: '/api/login',
            data: {
                'mobile': mobile,
                'password': password
            },
            dataType: 'json',
            timeout: 2000,
            success: function (data) {
                location.href = 'user.html';
            },
            error: function (xhr, type) {
                $loginTip.text('账号或密码错误').removeClass('hide');
                delay(function () {
                    $loginTip.addClass('hide');
                }, 1500);
            }
        });
    });

    // 注册
    $('#J_signupForm').submit(function (e) {
        e.preventDefault();

        var $signupMobile = $('#J_signupMobile');
        var $signupPwd = $('#J_signupPwd');
        var $signupPwd2 = $('#J_signupPwd2');
        var $signupTip = $('#J_signupTip');


        var mobile = $.trim($signupMobile.val());
        var password = $.trim($signupPwd.val());
        var password2 = $.trim($signupPwd2.val());

        if (mobile == '' || password == '' || password2 == '') {
            $signupTip.text('账号或密码不能为空').removeClass('hide');

            delay(function () {
                $signupTip.addClass('hide');
            }, 1500);

            return;
        };

        if (password != password2){
            $signupTip.text('您输入密码不一致').removeClass('hide');

            delay(function () {
                $signupTip.addClass('hide');
            }, 1500);

            return;
        }

        $.ajax({
            type: 'POST',
            url: '/api/signup',
            data: {
                'mobile': mobile,
                'password': password,
                'confirm_password': password2
            },
            dataType: 'json',
            timeout: 2000,
            success: function (data) {
                location.href = 'signup_verify.html?mobile=' + mobile;
            },
            error: function (xhr, type) {
                $signupTip.text('服务错误，请稍后重试').removeClass('hide');
                delay(function () {
                    $signupTip.addClass('hide');
                }, 1500);
            }
        });
    });

    // 注册-验证码
    $('#J_signupVerifyForm').submit(function (e) {
        e.preventDefault();

        var $signupVerify = $('#J_signupVerify');
        var $sucTip = $('#J_signupVerifyTip');
        var $errTip = $('#J_signupVerifyErrTip');

        var verify = $.trim($signupVerify.val());

        if (verify == '') {
            $errTip.text('短信验证码不能为空').removeClass('hide');

            delay(function () {
                $errTip.addClass('hide');
            }, 1500);

            return;
        };

        $.ajax({
            type: 'GET',
            url: '/finish_signup',
            data: {
                'mobile': parseURL().mobile,
                'verify_code': verify
            },
            dataType: 'json',
            timeout: 2000,
            success: function (data) {
                $sucTip.removeClass('hide');

                delay(function () {
                    $sucTip.addClass('hide');
                    location.href = 'user.html';
                }, 1500);
            },
            error: function (xhr, type) {
                $errTip.text('服务错误，请稍后重试').removeClass('hide');
                delay(function () {
                    $errTip.addClass('hide');
                }, 1500);
            }
        });
    });

    // 获取-手机验证码(包括找回密码)
    $('#J_signupGetVerify').click(function (e) {
        var $time = $('#J_verifyTime');
        var $forgetMobile = $('#J_forgetMobile');
        var $forgetTip = $('#J_forgetTip');
        var $this = $(this);
        var timer = null;
        var num = 59;
        var type = 1;
        var mobile = parseURL().mobile;

        if (!$time.text()) {


            if ($this.attr('class').indexOf('forget-verify') > -1){
                type = 2;

                if ($.trim($forgetMobile.val()) == '') {
                    $forgetTip.text('注册手机号不能为空').removeClass('hide');
                    delay(function () {
                        $forgetTip.addClass('hide');
                    }, 1500);

                    return;
                }

                mobile = $forgetMobile.val();
            }

            $this.addClass('disabled');

            $time.text('(' + num + ')');

            sendMobileVerify(mobile, type);

            timer = setInterval(function (){
                num--;
                $time.text('(' + num + ')');

                if (num == 1) {
                    clearInterval(timer);
                    $this.removeClass('disabled');
                    $time.text('');
                    num = 59;
                }
            }, 1000);
        }
    });


    // 忘记密码
    $('#J_forgetForm').submit( function (e) {
        var $errTip = $('#J_forgetTip');
        var $mobile = $('#J_forgetMobile');
        var $verify = $('#J_forgetVerify');

        var mobile = $.trim($mobile.val());
        var verify = $.trim($verify.val());

        if (mobile == '' || verify == '') {
            $errTip.removeClass('hide');

            delay(function () {
                $errTip.addClass('hide');
            }, 1500);

            return false;
        };
    });

    // 忘记密码-密码重置
    $('#J_forgetSetForm').submit( function (e) {
        var $errTip = $('#J_forgetErrSetTip');
        var $sucTip = $('#J_forgetSetTip');
        var $password = $('#J_forgetSetPassword');

        var password = $.trim($password.val());

        e.preventDefault();

        if (password == '') {
            $errTip.text('密码不能为空').removeClass('hide');

            delay(function () {
                $errTip.addClass('hide');
            }, 1500);
        };

        $.ajax({
            type: 'POST',
            url: '/forgot',
            data: {
                'mobile': parseURL().mobile,
                'verify_code': parseURL().verify,
                'password': password,
                'confirm_password': password
            },
            dataType: 'json',
            timeout: 2000,
            success: function (data) {
                $sucTip.removeClass('hide');

                delay(function () {
                    $sucTip.addClass('hide');
                    location.href = 'login.html';
                }, 1500);
            },
            error: function (xhr, type) {
                $errTip.text('服务错误，请稍后重试').removeClass('hide');
                delay(function () {
                    $errTip.addClass('hide');
                }, 1500);
            }
        });
    });

    // 显示密码
    $('#J_forgetSetCheckbox').change(function () {
        var $pwd = $('#J_forgetSetPassword');
        if ($(this).attr('checked')) {
            $pwd.attr('type', 'text');
        }
        else {
            $pwd.attr('type', 'password');
        }
    });
});
