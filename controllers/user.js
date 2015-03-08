var passport = require('passport'),
    User = require('../models/User'),
    Apply = require('../models/Apply'),
    userViewModel = require('../viewModels/user'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
    sms = require('../lib/sms'),
    async = require('async');


module.exports.postLogin = function(req, res, next) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/login');
    }

    var auth = passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('errors', { msg: info.message });
            return res.redirect('/login');
        }
        req.login(user, function(err) {
            if (err) {return next(err);}
            if (req.session.lastLocation) {
                var location = req.session.lastLocation;
                req.session.lastLocation = null;
                res.redirect(location);
            } else {
                res.redirect('/user');
            }
        });
    });
    auth(req, res, next);
};

module.exports.postSignup = function(req, res, next) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();
    req.assert('password', '密码至少需要6位').len(6);
    req.assert('confirm-password', '两次密码不匹配').equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/signup');
    }

    var user = new User({
        mobile: req.body.mobile,
        password: req.body.password
    });

    User.findOne({ mobile: req.body.mobile }, function(err, existingUser) {
        if (err) {
            return next(err);
        }
        if (existingUser) {
            req.flash('errors', { msg: '该手机号已经注册了.' });
            return res.redirect('/signup');
        }
        user.save(function(err) {
            if (err) return next(err);
            req.logIn(user, function(err) {
                if (err) return next(err);
                res.redirect('/user');
            });
        });
    });
};

module.exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

module.exports.postLogout = function(req, res) {
    req.logout();
    res.send();
};

module.exports.getIndex = function(req, res, next) {
    var user = req.user;

    user.getOrders(function(err, orders) {
        if(err) return next(err);
        res.render('user/index', {
            bootstrappedUser: JSON.stringify(userViewModel(user, orders)),
            layout: null
        });
    });
};

module.exports.getHome = function(req, res) {
    res.render('user/home', {layout:null});
};

module.exports.getProfile = function(req, res) {
    res.render('user/profile', {layout:null});
};

module.exports.getOrders = function(req, res) {
    res.render('user/orders', {layout:null});
};

module.exports.getSecurity = function(req, res) {
    res.render('user/security', {layout:null});
};

module.exports.getVerifyEmail = function(req, res) {
    res.render('user/verify_email', {layout:null});
};

module.exports.postVerifyEmail = function(req, res, next) {
    req.assert('email', '无效的邮件地址.').isEmail();

    var errors = req.validationErrors();

    if (errors) {
        return res.send({success:false, reason:errors[0].msg});
    }

    var user = req.user;
    async.waterfall([
        function(done) {
            crypto.randomBytes(16, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            user.verifyEmailToken = token;

            user.save(function(err) {
                done(err, token, user);
            });
        },
        function(token, user, done) {
            var transporter = nodemailer.createTransport({
                host: "smtp.qq.com",
                secureConnection: true,
                port: 465,
                auth: {
                    user: "niu_jin_wang@qq.com",
                    pass: "so6UoWg6"
                }
            });
            var mailOptions = {
                to: user.profile.email,
                from: 'support@niujin.com',
                subject: '验证您在牛金网使用的邮箱',
                text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            transporter.sendMail(mailOptions, function(err) {
                req.flash('info', { msg: 'An e-mail has been sent to ' + user.profile.email + ' with further instructions.' });
                done(err, 'done');
                transporter.close();
            });
        }
    ], function(err) {
        if (err) return res.send({success:false, reason:err.toString()});
        res.send({success:true});
    });
};

module.exports.getIdentity = function(req, res) {
    res.render('user/identity', {layout:null});
};

module.exports.getUserPay = function(req, res) {
    res.render('user/mypay', {layout:null});
};

module.exports.getWithdraw = function(req, res) {
    res.render('user/withdraw', {layout:null});
};

module.exports.getResetPassword = function(req, res) {
    res.render('user/change_pass', {layout:null});
};

module.exports.getApplyList = function(req, res) {
    res.render('user/apply_list', {layout:null});
};

module.exports.getUser = function(req, res, next) {
    User.findById(req.params.id, function(err, user) {
        if (err) next(err);
        res.send(user);
    });
};

module.exports.updateUser = function(req, res, next) {
    var uid = req.params.id ? req.params.id : req.user.id;
    if (req.params.id && req.params.id !== req.user.id) {
        return res.send({success:false, reason:'无效的用户！'});
    }
    var userData = req.body;
    User.update({_id:uid}, userData, function (err, numberAffected, raw) {
        if (err) {
            return res.send({success:false, reason:err.toString()});
        }
        res.send({success:true});
    });
};

module.exports.postUpdatePassword = function(req, res, next) {
    req.assert('password', '密码至少需要6位').len(6);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        return res.send({success:false, reason:errors[0].msg});
    }

    User.findById(req.user.id, function(err, user) {
        if (err) return res.send({success: false, reason: err.toString()});
        if (!user) return res.send({success: false, reason: '无效的用户！'});
        user.comparePassword(req.body.old_password, function (err, isMatch) {
            if (err) return res.send({success: false, reason: err.toString()});
            if (!isMatch) {
                return res.send({success: false, reason: '旧密码错误'});
            } else {
                user.password = req.body.password;

                user.save(function (err) {
                    if (err) return res.send({success: false, reason: err.toString()});
                    res.send({success: true});
                });
            }
        });
    });
};

module.exports.resetPassword = function(req, res, next) {
    req.assert('verify_code', '验证码错误').equals(req.session.sms_code);
    req.assert('password', '密码至少需要6位').len(6);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/forgot');
    }

    User.findOne({ mobile: req.body.mobile }, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('errors', { msg: '该手机号还未注册.' });
            return res.redirect('/forgot');
        }
        user.password = req.body.password;
        user.save(function (err) {
            if (err) {
                req.flash('errors', { msg: err.toString() });
                return res.redirect('/forgot');
            }
            req.flash('info', { msg: '您的密码已经修改成功!' });
            res.redirect('/login');
        });
    });
};

module.exports.sendVerifyCode = function(req, res, next) {
    if (!req.query.mobile) {
        return res.send({success:false, reason:'no mobile specified'});
    }
    var code = sms.generateVerifyCode();
    sms.sendSMS(req.query.mobile, code);
    req.session.sms_code = code;
    res.send({success:true});
    //res.send({success:true, verifyCode:code});
};

module.exports.payByBalance = function(req, res, next) {
    if (!req.user) {
        return res.send({success:false, reason:'无效的用户!'});
    }
    var data = req.body;

    User.findById(req.user.id, function(err, user) {
        if (err) {
            res.status(500);
            req.session.pay_error = {
                reason: err.toString()
            };
            return res.send({success:false, reason:err.toString()});
        }
        if (!user) {
            req.session.pay_error = {
                reason: '无效的用户!'
            };
            return res.send({success:false, reason:'无效的用户!'});
        }
        if (user.finance.balance < data.pay_amount) {
            req.session.pay_error = {
                reason: '余额不足，支付失败!'
            };
            return res.send({success:false, reason:'余额不足，支付失败!'});
        }
        user.finance.balance -= data.pay_amount;
        if (data.apply_id) {
            Apply.findOne({serialID:data.apply_id}, function(err, apply) {
                if (err) {
                    return res.send({success:false, reason:err.toString()});
                }
                apply.status = 4;
                apply.save(function (err) {
                    if (err) {
                        return res.send({success:false, reason:err.toString()});
                    }
                });
            });
        }
        user.save(function (err) {
            if (err) {
                res.status(500);
                req.session.pay_error = {
                    reason: err.toString()
                };
                return res.send({success:false, reason:err.toString()});
            }
            return res.send({success:true, data:user.finance.balance});
        });
    });
};

module.exports.updateBalance = function (req, res, next) {
    if (!req.user) {
        return res.send({success:false, reason:'无效的用户!'});
    }
    var data = req.body;
    var pay_amount = Number(data.pay_amount);
    console.log(pay_amount);
    if (pay_amount <= 0) {
        return res.send({success:false, reason:'无效的支付额:'+pay_amount});
    }

    User.findById(req.user.id, function(err, user) {
        if (err) {
            res.status(500);
            req.session.pay_error = {
                reason: err.toString()
            };
            return res.send({success:false, reason:err.toString()});
        }
        if (!user) {
            req.session.pay_error = {
                reason: '无效的用户!'
            };
            return res.send({success:false, reason:'无效的用户!'});
        }

        user.finance.balance += pay_amount;

        user.save(function (err) {
            if (err) {
                req.session.pay_error = {
                    reason: err.toString()
                };
                return res.send({success:false, reason:err.toString()});
            }
            return res.send({success:true});
        });
    });
};

module.exports.getResetFinancePassword = function(req, res) {
    res.render('user/change_finance_pass', {layout:null});
};

module.exports.postUpdateFinancePassword = function(req, res, next) {
    req.assert('new_password', '密码至少需要6位').len(6);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.new_password);

    var errors = req.validationErrors();

    if (errors) {
        return res.send({success:false, reason:errors[0].msg});
    }

    User.findById(req.user.id, function(err, user) {
        if (err) return res.send({success: false, reason: err.toString()});
        if (!user) return res.send({success: false, reason: '无效的用户！'});
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (err) return res.send({success: false, reason: err.toString()});
            if (!isMatch) {
                return res.send({success: false, reason: '登录密码错误!'});
            } else {
                user.finance.password = req.body.new_password;

                user.save(function (err) {
                    if (err) return res.send({success: false, reason: err.toString()});
                    res.send({success: true});
                });
            }
        });
    });
};

module.exports.verifyFinancePassword = function(req, res, next) {
    if (!req.user) {
        return res.send({success:false, reason:'无效的用户!'});
    }
    User.findById(req.user.id, function(err, user) {
        if (err) return res.send({success: false, reason: err.toString()});
        if (!user) return res.send({success: false, reason: '无效的用户！'});
        user.compareFinancePassword(req.body.password, function (err, isMatch) {
            if (err) return res.send({success: false, reason: err.toString()});
            if (!isMatch) {
                return res.send({success: false, reason: '提现密码错误!'});
            } else {
                res.send({success: true, result: user.finance.password});
            }
        });
    });
};
