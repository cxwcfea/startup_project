$(function() {

    var emailReg = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,5}$/;
    var passwordReg = /^[A-Za-z0-9]{6,14}$/;

    var $body = $('body');
    var $header = $body.find('header');

    // function showPopup(width, height, content) {
    //     if ($('.popup-wrapper').size() > 0) {
    //         $('.popup-wrapper').show();
    //         $('.popup')
    //             .empty()
    //             .css({
    //                 'margin-left': -1*(window.parseInt(width)/2),
    //                 'margin-top': -1*(window.parseInt(height)/2)
    //             })
    //             .append(content)
    //             .show();
    //     } else {
    //         $body.append(tpls.popup);
    //         $('.popup')
    //             .css({
    //                 'margin-left': -1*(window.parseInt(width)/2),
    //                 'margin-top': -1*(window.parseInt(height)/2)
    //             })
    //             .append(content)
    //             .show();
    //     }
    // }
    // function hidePopup() {
    //     $('.popup').hide().empty();
    //     $('.popup-wrapper').hide();
    // }

    // 错误提示
    function tipError($obj, html) {
        $obj.empty().html(html);
    }

    // 获取当前用户
    $.ajax({
        url: $.URL.user.isLogin,
        type: 'GET',
        cache: false,
        dataType: 'json'
    }).done(function(result) {
        if (result.code) {
            template.compile('header', tpls.header);
            var headerdom = template.render("header", result);
            $header.append(headerdom);
        }
    });

    $header.on('click', '#login', function() {
        // 登录
        showPopup(520, 330, tpls.login);
    }).on('click', '#register', function() {
        // 注册
        showPopup(520, 310, tpls.register);
    });

    $body.on('click', '.loginWrapper .close', function() {
        // 关闭弹窗
        hidePopup();
    }).on('click', '#forgetpassword', function() {
        // 点击 忘记密码
        showPopup(520, 260, tpls.forgetpassword);
    }).on('click', '.verifyImg img, #changeImg', function() {
        // 重置验证码
        var $this = $('.verifyImg img');
        var src = $this.attr('src').split('?')[0];
        $this.attr('src', src + '?_=' + new Date().getTime());
    }).on('click', '#send', function() {
        // 忘记密码 发送
        var $mail = $('#mail');
        var $verifyCode = $('#verifyCode');

        var mailVal = $.trim($mail.val());
        var verifyCodeVal = $.trim($verifyCode.val());

        var $forgetpasswordTipError = $('#forgetpasswordpopup .tiperror');

        if (!mailVal) {
            tipError($forgetpasswordTipError, '请输入邮箱');
            return false;
        } else if (!emailReg.test(mailVal)) {
            tipError($forgetpasswordTipError, '邮箱格式不正确');
            return false;
        }
        if (!/[0-9]{4}/.test(verifyCodeVal)) {
            tipError($forgetpasswordTipError, '验证码必须为4位数字');
            return false;
        }

        var datas = {};
        datas.captcha = verifyCodeVal;
        datas.email = mailVal;

        $.ajax({
            url: $.URL.user.prepareRetrievePwd,
            type: 'POST',
            data: datas,
            cache: false,
            dataType: 'text',
            success: function(result) {
                if (200 === result.code) {
                    alert(result.data);
                    window.location.reload();
                } else {
                    tipError($forgetpasswordTipError, result.message);
                }
            }
        });
    }).on('click', '#registerbtn', function() {
        // 注册用户
        var $email = $('#email');
        var $password = $('#password');
        var $repassword = $('#repassword');
        var $agree = $('#agree');

        var emailVal = $.trim($email.val());
        var paddwordVal = $.trim($password.val());
        var repaddwordVal = $.trim($repassword.val());
        var isAgree = $agree[0].checked;

        var $registerTipError = $('#registerpopup .tiperror');

        if (!emailVal) {
            tipError($registerTipError, '请输入邮箱');
            return false;
        } else if (!emailReg.test(emailVal)) {
            tipError($registerTipError, '邮箱格式不正确');
            return false;
        }
        if (!paddwordVal || !passwordReg.test(paddwordVal)) {
            tipError($registerTipError, '密码必须为数字字母，且长度6-14位');
            return false;
        }
        if (!repaddwordVal) {
            tipError($registerTipError, '请输入确认密码');
            return false;
        } else if (repaddwordVal !== paddwordVal) {
            tipError($registerTipError, '两次密码不一致');
            return false;
        }
        if (!isAgree) {
            tipError($registerTipError, '您还未接受用户协议');
            return false;
        }

        var datas = {};
        datas.email = $('#email').val();
        datas.password = $('#password').val();
        datas.isAgree = isAgree;

        $.ajax({
            url: $.URL.user.add,
            type: 'POST',
            data: {
                'jsonString': JSON.stringify(datas)
            },
            cache: false,
            dataType: 'json',
            success: function(result) {
                console.log(result);
                if (200 !== result.code) {
                    tipError($registerTipError, result.message);
                } else {
                    alert(result.message);
                    window.location.reload();
                }
            }
        });
    }).on('click', '#loginbtn', function() {
        // 用户登录
        var $email = $('#email');
        var $password = $('#password');
        var $captcha = $('#captcha');

        var emailVal = $.trim($email.val());
        var paddwordVal = $.trim($password.val());
        var captchaVal = $.trim($captcha.val());

        var $loginTipError = $('#loginpopup .tiperror');

        if (!emailVal) {
            tipError($loginTipError, '请输入邮箱');
            return false;
        } else if (!emailReg.test(emailVal)) {
            tipError($loginTipError, '邮箱格式不正确');
            return false;
        }
        if (!paddwordVal || !passwordReg.test(paddwordVal)) {
            tipError($loginTipError, '密码必须为数字字母，且长度6-14位');
            return false;
        }
        if (!/[0-9]{4}/.test(captchaVal)) {
            tipError($loginTipError, '验证码必须为4位数字');
            return false;
        }

        var datas = {};
        datas.j_username = emailVal;
        datas.j_password = paddwordVal;
        datas.j_captcha = captchaVal;


        $.ajax({
            url: $.URL.user.login,
            type: 'POST',
            data: datas,
            cache: false,
            dataType: 'json',
            success: function(result) {
                if (501 === result.code) {
                    tipError($loginTipError, result.msg);
                    $('#loginpopup .verifyImg img').trigger('click');
                    $('#captcha').val('');
                } else if (500 === result.code) {
                    tipError($loginTipError, result.msg);
                } else if (200 === result.code) {
                    // window.location.reload();
                    var userinfo = '<li>' +
                                        '<a href="me.html" id="userinfo">' + result.msg.username + '</a>' +
                                    '</li>' +
                                    '<li>' +
                                        '<a id="loginout" href="card/logout">退出</a>' +
                                    '</li>';
                    setTimeout(function() {
                        $('.login').html(userinfo);
                        hidePopup();
                    }, 500);
                }
            }
        });
    })

});
