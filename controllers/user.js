var passport = require('passport'),
    User = require('../models/User'),
    Order = require('../models/Order'),
    Apply = require('../models/Apply'),
    Homas = require('../models/Homas'),
    Contract = require('../models/Contract'),
    Note = require('../models/Note'),
    PayInfo = require('../models/PayInfo'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
    sms = require('../lib/sms'),
    needle = require('needle'),
    ursa = require('ursa'),
    log4js = require('log4js'),
    logger = log4js.getLogger('user'),
    util = require('../lib/util'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    _ = require('lodash'),
    sparkMD5 = require('spark-md5'),
    moment = require('moment'),
    ccap = require('ccap')(),
    xml2js = require("xml2js"),
    async = require('async');

module.exports.postLogin = function(req, res, next) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();
    req.assert('password', '密码至少需要6位').len(6);

    var errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        if (errors[0].param == 'mobile') {
            res.locals.error_feedback = 1;
        } else {
            res.locals.error_feedback = 2;
        }
        res.locals.title = '登录';
        res.locals.login = true;
        res.render('register/login', {
            layout: 'no_header'
        });
        return;
    }

    var auth = passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.locals.error_feedback = info.error_code;
            res.locals.title = '登录';
            res.locals.login = true;
            res.render('register/login', {
                layout: 'no_header'
            });
            return;
        }
        if (user.level === 1000) {
            logger.error('postLogin error:suspicious user tried login');
            res.locals.error_feedback = 4;
            res.locals.title = '登录';
            res.locals.login = true;
            res.render('register/login', {
                layout: 'no_header'
            });
            return
        }
        req.login(user, function(err) {
            if (err) {return next(err);}
            req.session.lastLogin = moment().format("YYYY-MM-DD HH:mm:ss");
            user.lastLoginAt = req.session.lastLogin;
            user.save(function (err){
                if (err){
                    logger.error('postLogin error:' + err.toString());
                }
            });
            if (req.session.lastLocation) {
                var location = req.session.lastLocation;
                req.session.lastLocation = null;
                res.redirect(location);
            } else {
                res.redirect('/');
            }
        });
    });
    auth(req, res, next);
};

module.exports.ajaxLogin = function(req, res) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();
    req.assert('password', '密码至少需要6位').len(6);

    var errors = req.validationErrors();

    if (errors) {
        logger.info('ajaxLogin error:' + errors);
        res.status(400);
        return res.send({error_code:1, error_msg:errors[0].msg});
    }

    var auth = passport.authenticate('local', function(err, user, info) {
        if (err) {
            logger.error('ajaxLogin error:' + err.toString());
            res.status(500);
            return res.send({error_code:2, error_msg:err.toString()});
        }
        if (!user) {
            logger.error('ajaxLogin error:' + info.message);
            res.status(400);
            return res.send({error_code:3, error_msg:info.message});
        }
        if (user.level === 1000) {
            logger.error('ajaxLogin error:suspicious user tried login');
            res.status(403);
            return res.send({error_code:3, error_msg:'您的账号已被冻结'});
        }
        req.login(user, function(err) {
            if (err) {
                logger.error('ajaxLogin error:' + err.toString());
                res.status(500);
                return res.send({error_code:2, error_msg:err.toString()});
            }
            req.session.lastLogin = moment().format("YYYY-MM-DD HH:mm:ss");
            user.lastLoginAt = req.session.lastLogin;
            user.save(function (err){
                if (err) {
                    logger.error('ajaxLogin error:' + err.toString());
                }
            });
            if (req.session.lastLocation) {
                res.send({location:req.session.lastLocation, user:getUserViewModel(req.user)});
                req.session.lastLocation = null;
            } else {
                res.send({location:'/', user:getUserViewModel(req.user)});
            }
        });
    });
    auth(req, res);
};

module.exports.verifyMobileCode = function(req, res) {
    if (!req.session.sms_code) {
        res.status(400);
        return res.send({ error_msg: '请重新获取验证码' });
    }

    if (req.session.sms_code.count > 6) {
        req.session.sms_code = undefined;
        res.status(403);
        return res.send({error_msg: '重试次数过多，请重新获取验证码'});
    }
    req.session.sms_code.count++;

    if (req.body.verify_code != req.session.sms_code.code) {
        res.status(400);
        return res.send({ error_msg: '验证码错误' });
    }

    if (req.session.sms_code.expires < Date.now()) {
        res.status(400);
        return res.send({error_msg:'验证码已失效'})
    }

    if (req.body.mobile != req.session.sms_code.mobile) {
        res.status(400);
        return res.send({ error_msg: '手机号不匹配' })
    }

    req.session.sms_code = undefined;

    res.send({});
};

module.exports.apiSignup = function(req, res) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();
    req.assert('password', '密码至少需要6位').len(6);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.password);

    var errors = req.validationErrors();
    if (errors) {
        res.status(400);
        return res.send({error_code:1, error_msg:errors[0].msg});
    }

    if (req.body.img_code) {
        req.body.img_code = req.body.img_code.toLowerCase();
    }
    console.log(req.body.img_code + ' ' + req.session.img_code);
    if (req.body.img_code != req.session.img_code) {
        res.status(403);
        return res.send({error_msg:'验证码错误,应为' + req.session.img_code});
    }

    var user = new User({
        mobile: req.body.mobile,
        password: req.body.password
    });

    User.findOne({ mobile: req.body.mobile }, function(err, existingUser) {
        if (err) {
            logger.warn('apiSignup err:' + err.toString());
            res.status(500);
            return res.send({error_code:3, error_msg:err.toString()});
        }
        if (existingUser && existingUser.registered) {
            logger.warn('apiSignup err:already registered');
            res.status(400);
            return res.send({error_code:2, error_msg:'该手机号已经注册'});
        }

        if (existingUser) {
            user = existingUser;
        }
        if (req.body.mgm_code) {
            user.refer = req.body.mgm_code;
        }
        user.save(function(err) {
            if (err) {
                logger.warn('apiSignup err:' + err.toString());
                res.status(500);
                return res.send({error_code:3, error_msg:err.toString()});
            }
            res.send({});
        });
    });
};

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}

function autoAssignManager(user) {
    /*
    var morning = moment();
    var isHoliday = util.isHoliday(morning.dayOfYear());
    if (isHoliday) {
        return;
    }
    morning.hour(9);
    morning.minute(0);
    morning.seconds(0);
    var afternoon = moment();
    afternoon.hour(19);
    afternoon.minute(0);
    afternoon.seconds(0);
    var now = moment();
     if (now >= morning && now <= afternoon) {
     }
    */
    if (user.refer && user.refer.indexOf('m_') === 0) {
        User.findOne({referName:user.refer}, function(err, u) {
            if (err) {
                logger.warn('autoAssignManager error:' + err.toString());
                return;
            }
            if (!u || !u.manager) {
                return;
            }
            user.manager = u.manager;
            user.save(function(err) {
                if (err) {
                    logger.warn('autoAssignManager error for ' + user.mobile + ' ' + err.toString());
                    return;
                }
            });
        });
    }
}

module.exports.finishSignup = function(req, res, next) {
    if (!req.session.sms_code) {
        res.status(400);
        return res.send({ error_msg: '请重新获取验证码' });
    }

    if (req.session.sms_code.count > 6) {
        req.session.sms_code = undefined;
        res.status(403);
        return res.send({error_msg: '重试次数过多，请重新获取验证码'});
    }
    req.session.sms_code.count++;

    if (req.body.verify_code != req.session.sms_code.code) {
        res.status(400);
        return res.send({ error_msg: '验证码错误' });
    }

    if (req.session.sms_code.expires < Date.now()) {
        res.status(400);
        return res.send({error_msg:'验证码已失效'})
    }

    if (req.body.mobile != req.session.sms_code.mobile) {
        res.status(400);
        return res.send({ error_msg: '手机号不匹配' })
    }

    req.session.sms_code = undefined;

    User.findOne({ mobile: req.body.mobile }, function(err, existingUser) {
        if (err) {
            return next(err);
        }
        if (existingUser && existingUser.registered) {
            res.status(400);
            return res.send({ error_msg: '该手机号已经注册了' })
        }
        existingUser.registered = true;
        if (req.session.refer && !existingUser.refer) {
            existingUser.refer = req.session.refer;
        }
        existingUser.referName = 'm_' + util.getReferName();
        existingUser.save(function(err) {
            if (err) {
                logger.warn('finishSignup err:' + err.toString());
                res.status(500);
                return res.send({ error_msg: err.toString() });
            }
            req.logIn(existingUser, function(err) {
                if (err) {
                    logger.warn('finishSignup err:' + err.toString());
                    res.status(500);
                    return res.send({ error_msg: err.toString() });
                }
                logger.info('user ' + existingUser.mobile + ' signup');
                logger.info('ua ' + req.headers['user-agent']);
                logger.info('ip ' + getClientIp(req));
                logger.info('ip ' + req.ip);
                res.send({});
                autoAssignManager(existingUser);
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

module.exports.postVerifyEmail = function(req, res, next) {
    if (!req.body) {
        res.status(400);
        return res.send({reason:'empty request'});
    }
    if (req.body.email.length > 120) {
        res.status(400);
        return res.send({reason:'email too long'});
    }
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
            user.profile.email = req.body.email;
            user.profile.email_verified = false;

            user.save(function(err) {
                done(err, token, user);
            });
        },
        function(token, user, done) {
            var transporter = nodemailer.createTransport('SMTP', {
                host: "smtp.qq.com",
                port: 465,
                secureConnection: true,
                auth: {
                    user: "niu_jin_wang@qq.com",
                    pass: "so6UoWg6"
                }
            });
            var mailOptions = {
                to: user.profile.email,
                from: 'niu_jin_wang@qq.com',
                subject: '欢迎加入牛金网',
                generateTextFromHTML: true,
                text: util.mobileDisplay(user.mobile) + '，您好 \n\n欢迎使用牛金网，为提升您账单信息安全性，请复制以下链接在浏览器地址栏中打开，以完成邮箱绑定。\n\n' +
                config.pay_callback_domain + '/user/verifyEmail/' + token + '\n\n'
            };
            transporter.sendMail(mailOptions, function(err) {
                if (err) {
                    logger.warn('error when send verify email: ' + err);
                }
                done(err, 'done');
                transporter.close();
            });
        }
    ], function(err) {
        if (err) return res.send({success:false, reason:err.toString()});
        res.send({success:true});
    });
};

exports.finishVerifyEmail = function(req, res) {
    res.locals.other_menu = true;
    User.findOne({ verifyEmailToken: req.params.token })
        .exec(function(err, user) {
            if (err || !user.profile.email) {
                if (err)
                    logger.warn('finishVerifyEmail error:' + err.toString());
                else
                    logger.warn('finishVerifyEmail error:user email empty');
                res.locals.msg = '邮件验证失败';
                return res.render('email_verify_result');
            }
            user.profile.email_verified = true;
            user.verifyEmailToken = null;
            user.save(function(err) {
                if (err) {
                    logger.warn('finishVerifyEmail error:' + err.toString());
                }
                res.locals.msg = '邮件验证成功，您的邮箱已经成功绑定!';
                return res.render('email_verify_result');
            });
        });
};

module.exports.postWithdraw = function(req, res) {
    var data = req.body;
    var amount = Number(data.order.amount);

    util.debugInfo(logger, req);
    async.waterfall([
        function(callback) {
            User.findById(req.user.id, function(err, user) {
                if (!err && !user) {
                    err = 'user not found';
                }
                callback(err, user);
            });
        },
        function(user, callback) {
            user.finance.balance = Number(user.finance.balance.toFixed(2));
            if (user.finance.balance < amount) {
                callback('余额不足');
            } else {
                if (data.password) {
                    user.compareFinancePassword(data.password, function (err, isMatch) {
                        if (!err && !isMatch) {
                            err = '提现密码错误!'
                        }
                        callback(err, user);
                    });
                } else {
                    callback(null, user);
                }
            }
        },
        function(user, callback) {
            if (user.level >= 999) {
                data.order.status = 3;
            } else {
                data.order.status = 0;
            }
            data.order.userBalance = user.finance.balance - amount;
            data.order.otherInfo = util.generateSerialID();
            Order.create(data.order, function(err, order) {
                callback(err, user, order);
            });
        },
        function(user, order, callback) {
            user.finance.balance -= amount;
            user.finance.freeze_capital += amount;
            user.save(function(err) {
                callback(err, user, order);
            });
        }
    ], function(err, user, order) {
        if (err) {
            res.status(401);
            res.send({reason:err.toString()});
        } else {
            res.send({success:true, order:order});
        }
    });
};

module.exports.getApplyList = function(req, res) {
    res.render('user/apply_list', {layout:null});
};

module.exports.updateUser = function(req, res) {
    if (req.params.id != req.user._id) {
        logger.warn('updateUser invalid user');
        res.status(401);
        return res.send({reason:'无效的用户'});
    }
    util.debugInfo(logger, req);
    var protectedProperties = [
        'mobile',
        'password',
        'roles',
        'registerAt',
        'freeApply',
        'finance',
        'verifyEmailToken',
        'resetPasswordToken',
        'resetPasswordExpires'
    ];

    var backupData = _.assign({}, req.body);
    var userData = _.omit(req.body, protectedProperties);

    User.update({_id:req.params.id}, userData, function (err, numberAffected, raw) {
        if (err) {
            logger.warn('updateUser db error:' + err.toString());
            res.status(503);
            return res.send({reason:err.toString()});
        }
        res.send(backupData);
    });
};

module.exports.postUpdatePassword = function(req, res, next) {
    req.assert('new_password', '密码至少需要6位').len(6);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.new_password);

    var errors = req.validationErrors();

    if (errors) {
        res.status(400);
        return res.send({error_msg:errors[0].msg});
    }

    User.findById(req.user._id, function(err, user) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (!user) {
            res.status(400);
            return res.send({error_msg: 'user not found'});
        }
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (err) {
                res.status(500);
                return res.send({error_msg: err.toString()});
            }
            if (!isMatch) {
                res.status(400);
                return res.send({error_msg: '原密码错误'});
            } else {
                user.password = req.body.new_password;

                user.save(function (err) {
                    if (err) {
                        res.status(500);
                        return res.send({error_msg: err.toString()});
                    }
                    res.send({});
                });
            }
        });
    });
};

module.exports.resetPassword = function(req, res, next) {
    if (!req.session.sms_code) {
        res.status(400);
        return res.send({ error_msg: '请重新获取验证码' });
    }

    if (req.session.sms_code.count > 6) {
        req.session.sms_code = undefined;
        res.status(403);
        return res.send({error_msg: '重试次数过多，请重新获取验证码'});
    }
    req.session.sms_code.count++;

    if (req.body.verify_code != req.session.sms_code.code) {
        res.status(400);
        return res.send({ error_msg: '验证码错误' });
    }

    if (req.session.sms_code.expires < Date.now()) {
        res.status(400);
        return res.send({error_msg:'验证码已失效'});
    }

    if (req.body.mobile != req.session.sms_code.mobile) {
        res.status(400);
        return res.send({ error_msg: '手机号不匹配' });
    }
    if (req.user && req.user.mobile != req.body.mobile) {
        res.status(400);
        return res.send({ error_msg: '手机号不是当前用户手机号' });
    }

    req.session.sms_code = undefined;

    User.findOne({ mobile: req.body.mobile }, function(err, user) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (!user) {
            res.status(400);
            return res.send({error_msg:'该手机号还未注册.'});
        }
        user.password = req.body.password;
        user.save(function (err) {
            if (err) {
                logger.warn('resetPassword err:' + err.toString());
                return res.redirect('/forgot');
            }
            res.send({});
        });
    });
};

module.exports.sendVerifyCode = function(req, res, next) {
    if (!req.query.mobile) {
        res.status(400);
        return res.send({success:false, reason:'no mobile specified'});
    }
    if (!req.query.code) {
        logger.debug('sendVerifyCode error: must have img code');
        res.status(403);
        return res.send({error_msg:'must have img code'});
    }
    if (req.query.code.toLowerCase() != req.session.img_code) {
        res.status(403);
        return res.send({error_msg:'图形验证码错误,应为' + req.session.img_code});
    }
    req.session.img_code = '';
    var code = sms.generateVerifyCode();
    if (!req.query.type) {
        sms.sendSMS(req.query.mobile, code);
    } else if (req.query.type == 1) {
        util.sendSMS_0(req.query.mobile, code);
    } else {
        util.sendSMS_1(req.query.mobile, code);
    }
    req.session.sms_code = {
        mobile: req.query.mobile,
        code: code,
        count: 0,
        expires: Date.now() + 3600000 // 1 hour
    };
    res.send({success:true});
};

module.exports.updateBalance = function (req, res, next) {
    if (!req.user) {
        return res.send({success:false, reason:'无效的用户!'});
    }
    var data = req.body;
    var pay_amount = Number(data.pay_amount);
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

module.exports.postUpdateFinancePassword = function(req, res, next) {
    req.assert('new_password', '密码至少需要6位').len(6);
    req.assert('confirm_password', '两次密码不匹配').equals(req.body.new_password);

    var errors = req.validationErrors();

    if (errors) {
        res.status(400);
        return res.send({error_msg:errors[0].msg});
    }

    if (!req.session.sms_code) {
        res.status(400);
        return res.send({ error_msg: '请重新获取验证码' });
    }

    if (req.session.sms_code.count > 6) {
        req.session.sms_code = undefined;
        res.status(403);
        return res.send({error_msg: '重试次数过多，请重新获取验证码'});
    }
    req.session.sms_code.count++;

    if (req.body.verify_code != req.session.sms_code.code) {
        res.status(400);
        return res.send({ error_msg: '验证码错误' });
    }

    if (req.session.sms_code.expires < Date.now()) {
        res.status(400);
        return res.send({error_msg:'验证码已失效'})
    }

    if (req.user.mobile != req.session.sms_code.mobile) {
        res.status(400);
        return res.send({ error_msg: '手机号不匹配' })
    }

    req.session.sms_code = undefined;

    User.findById(req.user._id, function(err, user) {
        if (err) {
            res.status(503);
            return res.send({error_msg: err.toString()});
        }
        if (!user) {
            res.status(503);
            return res.send({error_msg: '无效的用户！'});
        }
        user.finance.password = req.body.new_password;

        user.save(function (err) {
            if (err) {
                res.status(503);
                return res.send({error_msg: err.toString()});
            }
            res.send({});
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

module.exports.getIAppPayTransid = function(req, res) {
    console.log('getPayTransid');
    var orderID = req.body.id;
    var price = req.body.price;
    var uid = req.body.uid;
    var data = {
        appid: '3002011663',
        waresid: 1,
        waresname: '股票配资',
        cporderid: orderID,
        price: Number(price),
        currency: 'RMB',
        appuserid: uid,
        notifyurl: config.pay_callback_domain + '/api/iapp_feedback'
    };
    /*
    needle.post('http://ipay.iapppay.com:9999/payapi/order', data, { multipart: true })
        .on('readable', function() {
            while (result = this.read()) {
                console.log(result.toString());
            }
        })
        .on('end', function() {
            console.log('Ready-o, friend-o.');
            res.send({success:true});
        });
     */
    var jsonData = JSON.stringify(data);
    var client_private = '-----BEGIN RSA PRIVATE KEY-----\n'+
        'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAOW3mZeDOg58WF61\n'+
        '8rD4RN8plLAOOgOH1QAAR3y+vVQCxZpVvjLPLDZP0EBdWfSlFpkLIBaVPBiNq6dx\n'+
        'fyzrG04lX1EftmQyost7s9vkkjPj7fdbnQhVGvdee3f3/bLr0rC7By6qxiv5PCWF\n'+
        'mE1Asb9CnK/DlUPrCb8QE0Vf2fkbAgMBAAECgYEA3LdI2xwaFzsASZf2pHUW73jr\n'+
        'RTGWKjhDvumFxmUaUnMLW9vQkM8gAtszE/Td7sMEcG4RGcGv6UONz6escwM+ykdn\n'+
        'qpiqBo2aX3UYv6YJy2HV/9RmIS99dny/H6gRzMCyomPfyqXPLbmCNTcotb6zVs+h\n'+
        'lPN5o925veq1Y0TlF3kCQQD+0rgkWfrWt/7uVzkI7aXlewgTrvg5dJ0wdcDcSew/\n'+
        'AEbW2K1B1wB9fkNPKFgbp3PhSGjQba3ZvHfRQGo5/y1/AkEA5scylT3NNHpneE5L\n'+
        'TOKiDfk5LHraRS4k1N8pGpUXKFmwQDDvPq+1nBhe1KiR6ZggDep4aAPKzseheR4V\n'+
        'gcH6ZQJAIpj1i2n0FqcQo8eP5NhvR8L2i8WbyiE9HlE+iCo5OyyMcasliuToGiHE\n'+
        'fcDahZassw+ju3jIu+FM20pFoe41fQJARWfXQKcrlgLSJ450exUV49n2Zfg0uOWd\n'+
        '0h+jfwkjw9Dlfwi4i0PQ/LcfnhlseLJ1wXmo6K9rSTEk0QZJNZMfOQJBAO78rY7M\n'+
        '17fetd0VcaWnraXNBC22pWrQnLo9QpskV5hOu5gxW4FbED4L5NA0JeI1nyFLZGr/\n'+
        'PBBcfmNYWA6LmzQ=\n'+
        '-----END RSA PRIVATE KEY-----';
    var priv = ursa.createPrivateKey(new Buffer(client_private));
    var content = new Buffer(jsonData);
    var sig = priv.hashAndSign('md5', content, 'utf8', 'base64');
    var data = 'transdata=' + jsonData + '&sign=' + sig + '&signtype=RSA';
    /*
    console.log(sig);
    var otherData = 'transdata={"appid":"3002011663","waresid":1,"waresname":"股票配资","cporderid":"54feadf6154755cd492fb0b6","price":107.52,"currency":"RMB","appuserid":"54f51b9d0fb27dbf0a402666"}&sign=E1qEtYQKW1VLf0mn0OT05AMYv77xh0ramUAENOPS59jDKY4dViaIu0pDOzTGJGxeCLzfjCG0dfzXlNd5ofhGiHsVwh7TwvoVkqhb1dkyWNqvxKkrCWCvotKysJlZg5dh0O+VUQj0xUph1FOwEhJFNoX1gAabFkZb01mQlP/4QPI=&signtype=RSA';
    console.log(otherData);
    */
    needle.post('http://ipay.iapppay.com:9999/payapi/order', data, function(err, resp, body) {
        logger.debug(body);
        if (body) {
            var index = body.indexOf('{');
            var index2 = body.indexOf('}');
            var len = index2 - index + 1;
            var result = body.substr(index, len);
            var obj = JSON.parse(result);
            //transdata={"code":1002,"errmsg":"请求参数错误"}
            logger.info(obj);
            if (obj.transid) {
                res.send({success:true, transid:obj.transid});
                var orderData = {
                    transID: obj.transid
                };
                Order.update({_id:orderID}, orderData, function (err, numberAffected, raw) {
                    if (err) {
                        logger.warn('error when updateOrder:' + err.toString());
                    }
                });
            } else {
                res.send({success:false});
            }
        } else {
            logger.debug(error);
            logger.debug(resp);
            res.send({success:false});
        }
    });
};

module.exports.iappPayFeedback = function(req, res) {
    logger.debug('iappPayFeedback');
    logger.debug(req.body);
    if (req.body.transdata) {
        var result = JSON.parse(req.body.transdata);
        logger.debug(result);
        if (result.result === 0) {
            async.waterfall([
                function(callback) {
                    Order.findById(result.cporderid, function(err, order) {
                        if (!err && !order) {
                            err = 'order not found:' + result.OrderNo;
                        }
                        callback(err, order);
                    });
                },
                function(order, callback) {
                    if (order.status === 1) {
                        callback('order already paid:' + order._id);
                        return;
                    }
                    var pay_amount = Number(result.money);
                    if (pay_amount <= 0) {
                        callback('pay_amount not valid:' + pay_amount);
                        return;
                    }
                    if (order.amount !== pay_amount) {
                        callback('pay_amount not match order\'s amount: ' + order.amount + ' vs ' + pay_amount);
                        return;
                    }
                    order.status = 1;
                    order.payType = 0;
                    order.save(function (err) {
                        callback(err, order, pay_amount);
                    });
                },
                function(order, pay_amount, callback) {
                    logger.info("pay success for order:" + order._id + " by " + pay_amount);
                    User.findById(order.userID, function(err, user) {
                        if (!err && !user) {
                            err = 'can not find user:' + order.userID;
                        }
                        callback(err, user, order, pay_amount);
                    });
                },
                function(user, order, pay_amount, callback) {
                    user.finance.balance += pay_amount;
                    user.save(function(err) {
                        callback(err, user, order, pay_amount);
                    });
                },
                function(user, order, pay_amount, callback) {
                    logger.debug('iappPayFeedback success update user:' + user._id + ' and order:' + order._id);
                    if (order.applySerialID) {
                        logger.info('iappPayFeedback pay apply');
                        callback(null, true, user, order.applySerialID, pay_amount);
                    } else {
                        callback(null, false, null, null, null);
                    }
                },
                function(working, user, apply_serial_id, pay_amount, callback) {
                    if (working) {
                        Apply.findOne({serialID: apply_serial_id}, function(err, apply) {
                            if (!err && !apply) {
                                err = 'can not found apply when pay apply:' + apply_serial_id;
                            }
                            callback(err, true, user, apply, pay_amount);
                        });
                    } else {
                        callback(null, false, null, null, null);
                    }
                },
                function(working, user, apply, pay_amount, callback) {
                    if (working) {
                        if (apply.status === 1) {
                            var serviceFee = util.getServiceFee(apply, apply.period);
                            if (apply.isTrial) {
                                serviceFee = 0;
                            }
                            var total = Number((apply.deposit + serviceFee).toFixed(2));
                            var user_balance = Number(user.finance.balance.toFixed(2));
                            if (user_balance < total) {
                                callback('no enough balance to pay apply:' + apply.serialID);
                            } else {
                                apply.status = 4;
                                apply.save(function (err) {
                                    callback(err, true, user, total, apply, serviceFee, true);
                                });
                            }
                        } else if (apply.status === 2) { // in this case (apply in process, order pay for it), it means the order is for add deposit
                            user.finance.balance -= pay_amount;
                            user.finance.deposit += pay_amount;
                            user.save(function(err) {
                                callback(err, false, null, null, null, null, null);
                            });
                        }
                    } else {
                        callback(null, false, null, null, null, null, null);
                    }
                },
                function(working, user, total, apply, serviceFee, createOrder, callback) {
                    if (createOrder) {
                        var orderData = {
                            userID: user._id,
                            userMobile: user.mobile,
                            dealType: 9,
                            amount: apply.deposit,
                            status: 1,
                            description: '缴纳配资保证金',
                            applySerialID: apply.serialID
                        };
                        Order.create(orderData, function(err, payOrder) {
                            if (!err && !payOrder) {
                                err = 'can not create pay order when pay apply:' + apply.serialID;
                            }
                            callback(err, true, user, total, apply, serviceFee);
                        });
                    } else {
                        callback(null, false, null, null, null, null);
                    }
                },
                function(working, user, total, apply, serviceFee, callback) {
                    if (working) {
                        user.finance.balance -= total;
                        user.finance.deposit += apply.deposit;
                        user.finance.total_capital += apply.amount;
                        user.finance.freeze_capital += serviceFee;
                        user.finance.history_capital += apply.amount;
                        user.finance.history_deposit += apply.deposit;
                        user.save(function (err) {
                            callback(err, 'success pay apply');
                        });
                    } else {
                        callback(null, 'done');
                    }
                }
            ], function(err, result) {
                if (err) {
                    logger.error('iappPayFeedback error:' + err.toString());
                } else {
                    logger.info('iappPayFeedback result:' + result);
                }
            });
        } else {
            logger.warn('iappPayFeedback pay failed, result not 0');
        }
    } else {
        logger.warn('iappPayFeedback pay failed, no data returned');
    }
    res.send('SUCCESS');
};

module.exports.beifuFeedback = function(req, res) {
    res.send('OK');
};

module.exports.beifuWithdrawFeedback = function(req, res) {
    var notify_id = req.query.notify_id;
    logger.debug('beifuWithdrawFeedback ' + req.query.trade_status);
    if (req.query.trade_status) {
        if (req.query.trade_status == 3) {
            async.waterfall([
                function(callback) {
                    Order.findById(req.query.out_trade_no, function(err, order) {
                        if (!order) {
                            err = 'order not found';
                        } else {
                            if (order.status === 1) {
                                err = 'order already approved';
                            }
                        }
                        callback(err, order);
                    });
                },
                function(order, callback) {
                    Order.update({_id:req.query.out_trade_no}, {status: 1}, function(err, numberAffected, raw) {
                        if (numberAffected == 0) {
                            err = 'nothing to update when update order';
                        }
                        callback(err, order);
                    });
                },
                function(order, callback) {
                    User.update({_id:order.userID}, {$inc: {'finance.freeze_capital':-order.amount}}, function(err, numberAffected, raw) {
                        if (numberAffected == 0) {
                            err = 'nothing to update when update user';
                        }
                        callback(err, order);
                    });
                }
            ], function(err, order) {
                if (err) {
                    logger.warn('beifuWithdrawFeedback error when order success for order ' + req.query.out_trade_no + ' :' + err.toString());
                } else {
                    logger.info('beifuWithdrawFeedback success for order ' + req.query.out_trade_no);
                }
            });
        } else if (req.query.trade_status == 4) {
            Order.update({_id:req.query.out_trade_no}, {status:0, otherInfo:req.query.error_message}, function(err, numberAffected, raw) {
                logger.warn('beifuWithdrawFeedback failed for order ' + req.query.error_message);
            });
        }
    }
    res.send(notify_id);
};

module.exports.shengpayFeedback = function(req, res) {
    logger.debug('shengpayFeedback');
    logger.debug(req.body);
    var result = req.body;
    if (!result) {
        res.status(400);
        return res.send({error_msg:'empty response'});
    }

    var origin = result.Name+result.Version+result.Charset+result.TraceNo+result.MsgSender+result.SendTime+
        result.InstCode+result.OrderNo+result.OrderAmount+result.TransNo+result.TransAmount+
        result.TransStatus+result.TransType+result.TransTime+result.MerchantNo+result.ErrorCode+
        result.ErrorMsg+result.Ext1+result.SignType+'JDJhJDA1JHpMRVc3UkJLR202R2hhNHZzZllMYi5';
    var sig = sparkMD5.hash(origin);
    sig = sig.toUpperCase();
    if (sig == result.SignMsg) {
        logger.debug('shengpayFeedback sign equal');
    } else {
        logger.warn('shengpayFeedback md5 sign not equal. their sign:' + result.SignMsg + ' our sign:' + sig);
    }

    if (result.TransStatus && result.TransStatus === '01') {
        async.waterfall([
            function(callback) {
                Order.findById(result.OrderNo, function(err, order) {
                    if (!err && !order) {
                        err = 'order not found:' + result.OrderNo;
                    }
                    callback(err, order);
                });
            },
            function(order, callback) {
                User.findById(order.userID, function (err, user) {
                    if (!err && !user) {
                        err = 'can not find user:' + order.userID;
                    }
                    callback(err, user, order);
                });
            },
            function(user, order, callback) {
                order.payType = 1;
                order.transID = result.TransNo;
                order.bankTransID = result.PaymentNo;
                var pay_amount = Number(result.TransAmount);
                if (pay_amount <= 0) {
                    callback('pay_amount not valid:' + pay_amount);
                    return;
                }
                if (order.amount !== pay_amount) {
                    callback('pay_amount not match order\'s amount: ' + order.amount + ' vs ' + pay_amount);
                    return;
                }
                util.orderFinished(user, order, 1, function(err) {
                    logger.debug('shengpayFeedback success update user:' + user._id + ' and order:' + order._id);
                    callback(err, user, order);
                });
            },
            function(user, order, callback) {
                if (order.applySerialID) {
                    logger.info('shengpayFeedback pay apply');
                    Apply.findOne({serialID:order.applySerialID}, function(err, apply) {
                        if (!err && !apply) {
                            err = 'can not found apply when pay apply:' + order.applySerialID;
                        }
                        callback(err, user, apply, order);
                    });
                } else {
                    callback(null, user, null, null);
                }
            },
            function(user, apply, order, callback) {
                if (apply) {
                    if (apply.status === 1) {
                        util.applyConfirmed(user, apply, function(err) {
                            callback(err, 'success pay for apply');
                        });
                    } else if (apply.status === 2) {
                        logger.info('shengpayFeedback apply add deposit');
                        util.applyDepositAdded(user, apply, order.amount, function(err) {
                            callback(err, 'success add deposit to apply');
                        });
                    } else {
                        callback(null, 'done');
                    }
                } else {
                    callback(null, 'done');
                }
            },
        ], function(err, result) {
            if (err) {
                logger.warn('shengpayFeedback error:' + err.toString());
            } else {
                logger.info('shengpayFeedback result:'+result);
            }
        });
    }
    res.send('OK');
};

function sendSMS(req, res, next) {
    var data = req.body;
    if (data.sms_content.length > 500) {
        res.status(400);
        return res.send({error_msg:'content too long'});
    }
    sms.sendSMS(req.user.mobile, '', data.sms_content, function (result) {
        if (result.error) {
            res.status(500);
            return res.send({error_msg:result.msg});
        } else {
            res.send({});
        }
    });
}

function getUserHome(req, res, next) {
    util.debugInfo(logger, req);
    res.locals.user_menu = true;
    res.render('user/home', {
        bootstrappedUserObject: JSON.stringify(getUserViewModel(req.user))
    });
}

function verifyEmailBySMS(req, res) {
    req.assert('email', '无效的邮件地址.').isEmail();

    var errors = req.validationErrors();

    if (errors) {
        res.status(400);
        return res.send({error_msg:errors[0].msg});
    }

    if (!req.session.sms_code) {
        res.status(400);
        return res.send({ error_msg: '请重新获取验证码' });
    }

    if (req.session.sms_code.count > 6) {
        req.session.sms_code = undefined;
        res.status(403);
        return res.send({error_msg: '重试次数过多，请重新获取验证码'});
    }
    req.session.sms_code.count++;

    if (req.body.verify_code != req.session.sms_code.code) {
        res.status(400);
        return res.send({ error_msg: '验证码错误' });
    }

    if (req.session.sms_code.expires < Date.now()) {
        res.status(400);
        return res.send({error_msg:'验证码已失效'})
    }

    if (req.user.mobile != req.session.sms_code.mobile) {
        res.status(400);
        return res.send({ error_msg: '手机号不匹配' })
    }

    req.session.sms_code = undefined;

    User.findById(req.user._id, function(err, user) {
        if (err) {
            res.status(503);
            return res.send({error_msg: err.toString()});
        }
        if (!user) {
            res.status(503);
            return res.send({error_msg: '无效的用户！'});
        }
        user.profile.email = req.body.email;
        user.profile.email_verified = true;

        user.save(function (err) {
            if (err) {
                res.status(503);
                return res.send({error_msg: err.toString()});
            }
            res.send({});
        });
    });
}

function payMiddleStep(req, res, next) {
    if (!req.body) {
        return next();
    }
    var Name = req.body.Name;
    var Version = req.body.Version;
    var Charset = req.body.Charset;
    var MsgSender = req.body.MsgSender;
    var OrderNo = req.body.OrderNo;
    var OrderAmount = req.body.OrderAmount;
    var OrderTime = moment().format("YYYYMMDDHHmmss");
    var PayType = req.body.PayType;
    var PayChannel = 19;
    var InstCode = req.body.InstCode;
    var PageUrl = req.body.PageUrl;
    var BackUrl = req.body.BackUrl;
    var NotifyUrl = req.body.NotifyUrl;
    var ProductName = req.body.ProductName;
    var BuyerIp = req.body.BuyerIp;
    var SignType = 'MD5';
    var md5Key = 'JDJhJDA1JHpMRVc3UkJLR202R2hhNHZzZllMYi5';

    var sign_origin = Name+Version+Charset+MsgSender+OrderNo+OrderAmount+OrderTime+
        PayType+PayChannel+InstCode+PageUrl+BackUrl+NotifyUrl+ProductName+BuyerIp+SignType+md5Key;
    var sig = sparkMD5.hash(sign_origin);
    sig = sig.toUpperCase();

    res.render('shengpay_middle_step', {
        order_id: req.body.OrderNo,
        order_amount: req.body.OrderAmount,
        order_time: OrderTime,
        pay_channel: PayChannel,
        bank_id: req.body.InstCode,
        user_ip: req.body.BuyerIp,
        sign_value: sig,
        page_url: req.body.PageUrl,
        back_url: req.body.BackUrl,
        notify_url: req.body.NotifyUrl,
        layout: null
    });
}

function beifuGetDynCode(req, res, next) {
    var order_id = req.body.out_trade_no;
    async.waterfall([
        function(callback) {
            if (order_id) {
                Order.findById(req.body.out_trade_no, function(err, order) {
                    if (!order) {
                        err = 'order not found';
                    }
                    if (err) {
                        callback(err);
                    } else {
                        order.description += ' 贝付移动充值';
                        order.amount = Number(Number(req.body.amount).toFixed(2));
                        order.payType = 5;
                        order.save(function(err) {
                            callback(err, order);
                        });
                    }
                });
            } else {
                var newOrder = {};
                newOrder.userID = req.user._id;
                newOrder.userMobile = req.user.mobile;
                newOrder.dealType = 1;
                newOrder.amount = Number(Number(req.body.amount).toFixed(2));
                newOrder.description = '贝付移动充值';
                newOrder.payType = 5;
                newOrder.status = 2;
                Order.create(newOrder, function(err, order) {
                    if (!err && !order) {
                        err = 'can not create order';
                    }
                    order_id = order._id;
                    callback(err, order);
                });
            }
        },
        function(order, callback) {
            var data;
            if (req.body.card_no) {
                data = {
                    service: 'ebatong_mp_dyncode',
                    partner: '201504141356306494',
                    input_charset: 'UTF-8',
                    sign_type: 'MD5',
                    customer_id: req.user._id,
                    card_no: req.body.card_no,
                    real_name: req.body.real_name,
                    cert_no: req.body.cert_no,
                    cert_type: '01',
                    out_trade_no: order_id,
                    amount: Number(Number(req.body.total_fee).toFixed(2)),
                    bank_code: req.body.bank_code,
                    card_bind_mobile_phone_no: req.body.card_bind_mobile_phone_no
                };
            } else {
                data = {
                    service: 'ebatong_mp_dyncode',
                    partner: '201504141356306494',
                    input_charset: 'UTF-8',
                    sign_type: 'MD5',
                    customer_id: req.user._id,
                    out_trade_no: order_id,
                    amount: Number(Number(req.body.total_fee).toFixed(2))
                };
            }
            var md5key = 'DH7WNCLKEB7KM897T8YBUB6Y3ETO3Atykisu';

            var keys = _.keys(data);
            keys = _.sortBy(keys);
            var str = '';
            for (var i = 0; i < keys.length-1; ++i) {
                str += keys[i] + '=' + data[keys[i]] + '&';
            }
            str += keys[i] + '=' + data[keys[i]];
            var sign = sparkMD5.hash(str+md5key);
            data['sign'] = sign;
            var url = 'https://www.ebatong.com/mobileFast/getDynNum.htm';
            var options = {
                json: true,
                follow_max: 3 // follow up to three redirects
            };
            needle.post(url, data, options, function(err, resp, body) {
                callback(err, body);
            });
        }
    ], function(err, data) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        var dataObj = JSON.parse(data);
        logger.debug(dataObj);
        if (dataObj['result'] === "T") {
            if (dataObj['out_trade_no'] == order_id && dataObj['customer_id'] == req.user._id) {
                res.send({token:dataObj.token, order_id:order_id});
            } else {
                res.status(503);
                res.send({error_msg:'数据不匹配'});
            }
        } else {
            res.status(400);
            res.send({error_msg:dataObj['error_message']});
        }
    });
}

function beifuPay(req, res) {
    var verify_code = req.body.verify_code;
    if (!verify_code) {
        res.status(400);
        return res.send({error_msg:'验证码不能为空'});
    }
    var data;
    if (req.body.card_no) {
        data = {
            sign_type: 'MD5',
            service: 'create_direct_pay_by_mp',
            partner: '201504141356306494',
            input_charset: 'UTF-8',
            notify_url: config.pay_callback_domain + '/api/beifu_feedback',
            customer_id: req.user._id,
            dynamic_code_token: req.body.token,
            dynamic_code: verify_code,
            bank_card_no: req.body.card_no,
            real_name: req.body.real_name,
            cert_no: req.body.cert_no,
            cert_type: '01',
            out_trade_no: req.body.out_trade_no,
            card_bind_mobile_phone_no: req.body.card_bind_mobile_phone_no,
            subject: 'margin trade',
            total_fee: Number(Number(req.body.total_fee).toFixed(2)),
            default_bank: req.body.bank_code,
            exter_invoke_ip: req.body.exter_invoke_ip
        };
    } else {
        data = {
            sign_type: 'MD5',
            service: 'create_direct_pay_by_mp',
            partner: '201504141356306494',
            input_charset: 'UTF-8',
            notify_url: config.pay_callback_domain + '/api/beifu_feedback',
            customer_id: req.user._id,
            dynamic_code_token: req.body.token,
            dynamic_code: verify_code,
            out_trade_no: req.body.out_trade_no,
            subject: 'margin trade',
            total_fee: Number(Number(req.body.total_fee).toFixed(2)),
            exter_invoke_ip: req.body.exter_invoke_ip
        };
    }
    var md5key = 'DH7WNCLKEB7KM897T8YBUB6Y3ETO3Atykisu';

    async.waterfall([
        function (callback) {
            var timeStr = "input_charset=UTF-8&partner=201504141356306494&service=query_timestamp&sign_type=MD5";
            var sign1 = sparkMD5.hash(timeStr+md5key);
            timeStr += '&sign=' + sign1;
            var url = 'http://www.ebatong.com/gateway.htm?' + timeStr;

            var options = {
                follow_max: 3 // follow up to three redirects
            };
            needle.get(url, options, function(err, resp, body) {
                if (err) {
                    callback(err);
                } else {
                    var timestamp = body.ebatong.response.timestamp.encrypt_key;
                    callback(null, timestamp);
                }
            });
        },
        function(timestamp, callback) {
            if (!timestamp) {
                callback('can not get timestamp');
            }
            data.anti_phishing_key = timestamp;
            var keys = _.keys(data);
            keys = _.sortBy(keys);
            var str = '';
            for (var i = 0; i < keys.length-1; ++i) {
                str += keys[i] + '=' + data[keys[i]] + '&';
            }
            str += keys[i] + '=' + data[keys[i]];
            var sign = sparkMD5.hash(str+md5key);
            data['sign'] = sign;

            var url = 'https://www.ebatong.com/mobileFast/pay.htm';
            var options = {
                json: true,
                follow_max: 3 // follow up to three redirects
            };
            needle.post(url, data, options, function(err, resp, body) {
                callback(err, body);
            });
        },
        function(body, callback) {
            var result = JSON.parse(body);
            logger.debug(result);
            if (result['result'] === "T") {
                if (result['customer_id'] == req.user._id) {
                    logger.info('beifuPay success user:' + req.user.mobile);
                    callback(null, result.total_fee);
                } else {
                    callback('数据不匹配');
                }
            } else {
                callback(result['error_message']);
            }
        },
        function(amount, callback) {
            User.findById(req.user._id, function(err, user) {
                if (!err && !user) {
                    err = 'user not found';
                }
                callback(err, user, amount);
            });
        },
        function(user, amount, callback) {
            Order.findById(req.body.out_trade_no, function(err, order) {
                if (!err && !order) {
                    err = 'order not found';
                }
                callback(err, user, order, amount);
            });
        },
        function(user, order, amount, callback) {
            if (amount <= 0) {
                callback('pay amount not valid:' + amount);
                return;
            }
            /*
            if (Number(order.amount.toFixed(2)) != Number(amount)) {
                callback('pay amount not match order\'s amount: ' + order.amount + ' vs ' + amount);
                return;
            }
            */
            order.payType = 5;
            util.orderFinished(user, order, 1, function(err) {
                callback(err, user, order);
            });
        },
        function(user, order, callback) {
            logger.info('beifuPay update user & order successfully');
            if (order.applySerialID) {
                logger.info('beifuPay pay apply');
                Apply.findOne({serialID:order.applySerialID}, function(err, apply) {
                    if (!err && !apply) {
                        err = 'can not found apply when pay apply:' + order.applySerialID;
                    }
                    callback(err, user, apply, order);
                });
            } else {
                callback(null, user, null, null);
            }
        },
        function(user, apply, order, callback) {
            if (apply) {
                if (apply.status === 1) {
                    util.applyConfirmed(user, apply, function(err) {
                        callback(err);
                    });
                } else if (apply.status === 2) {
                    logger.info('beifuPay apply add deposit');
                    util.applyDepositAdded(user, apply, order.amount, function(err) {
                        callback(err);
                    });
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        },
        function(callback) {
            PayInfo.findOne({userID:req.user._id}, function (err, payInfo) {
                callback(err, payInfo);
            });
        },
        function(payInfo, callback) {
            if (data.bank_card_no) {
                var payInfoData = {
                    userID: req.user._id,
                    mobile: data.card_bind_mobile_phone_no,
                    certNo: data.cert_no,
                    bankCode: data.default_bank,
                    cardID: data.bank_card_no,
                    userName: data.real_name
                };
                if (payInfo) {
                    PayInfo.update({userID:req.user._id}, payInfoData, function (err, numberAffected, raw) {
                        callback(err);
                    });
                } else {
                    PayInfo.create(payInfoData, function (err, payInfo) {
                        if (!payInfo) {
                            logger.warn('beifuPay create payinfo fail for user:' + req.user.mobile);
                        }
                        callback(err);
                    });
                }
            } else {
                callback(null);
            }
        }
    ], function(err) {
        if (err) {
            logger.debug('beifuPay error:' + err.toString());
            res.status(503);
            return res.send({error_msg:'支付失败'});
        }
        res.send({});
    });
}

var investPrivateProperties = [
    'availableAmount',
    'occupiedAmount',
    'history_invest_amount',
    'history_invest_profit',
    'total_invest_days'
];

function investUpdate(req, res) {
    var invest = req.body.invest;
    if (!invest || !invest.profitRate || !invest.duration || invest.profitRate > 20 || invest.profitRate < 1 || invest.duration > 30 || invest.duration < 1) {
        res.status(403);
        return res.send({error_msg:'invalid input'});
    }
    invest = _.omit(invest, investPrivateProperties);
    User.findOne({mobile:req.user.mobile}, function(err, user) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (!user) {
            res.status(500);
            return res.send({error_msg:'user not found:' + req.user.mobile});
        }
        user.invest.enable = invest.enable;
        user.invest.duration = invest.duration;
        user.invest.profitRate = invest.profitRate;
        user.save(function(err) {
            if (err) {
                res.status(500);
                return res.send({error_msg:err.toString()});
            }
            res.send({});
        });
    });
}

function investToBalance(req, res) {
    var amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
        res.status(400);
        return res.send({error_msg:'无效的金额'});
    }
    User.update({_id:req.user._id}, {$inc: {'finance.balance':amount, 'invest.availableAmount':-amount}}, function(err, numberAffected, raw) {
        if (err) {
            logger.warn('investToBalance error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (!numberAffected) {
            res.status(500);
            return res.send({error_msg:'can not update User'});
        }
        var orderData = {
            userID: req.user._id,
            userMobile: req.user.mobile,
            dealType: 18,
            amount: Number(amount.toFixed(2)),
            status: 1,
            description: '投资本金转回余额',
            userBalance: req.user.finance.balance + amount
        };
        Order.create(orderData, function(err, order) {
            if (err) {
                logger.warn('investToBalance error:' + err.toString());
                res.status(500);
                return res.send({error_msg:err.toString()});
            }
            res.send({});
        });
    });
}

function rechargeToInvest(req, res) {
    var amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
        res.status(400);
        return res.send({error_msg:'无效的金额'});
    }
    User.update({$and:[{_id:req.user._id}, {'finance.balance':{$gte:amount}}]}, {$inc: {'finance.balance':-amount, 'invest.availableAmount':amount}, $set: {'invest.enable':true}}, function(err, numberAffected, raw) {
        if (err) {
            logger.warn('rechargeToInvest error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (!numberAffected) {
            res.status(403);
            return res.send({error_code:1, error_msg:'余额不足'});
        }
        var orderData = {
            userID: req.user._id,
            userMobile: req.user.mobile,
            dealType: 17,
            amount: Number(amount.toFixed(2)),
            status: 1,
            description: '余额转入投资本金',
            userBalance: req.user.finance.balance - amount
        };
        Order.create(orderData, function(err, order) {
            if (err) {
                logger.warn('rechargeToInvest error:' + err.toString());
                res.status(500);
                return res.send({error_msg:err.toString()});
            }
            res.send({});
        });
    });
}

function getInvestOrders(req, res) {
    Order.find({$and:[{dealType:16}, {userID:req.user._id}]}, function(err, orders) {
        if (err) {
            logger.warn('getInvestOrders error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        var ids = orders.map(function(elem) {
            return elem.contractID;
        });
        Contract.find({_id:{$in:ids}}, function(err, contracts) {
            if (err) {
                logger.warn('getInvestOrders error:' + err.toString());
                res.status(500);
                return res.send({error_msg:err.toString()});
            }
            res.send({contracts:contracts, orders:orders});
        });
    });
}

function getUserInvestDetail(req, res) {
    Order.find({$and:[{userMobile:req.user.mobile}, {dealType:16}, {status:2}]}, function(err, orders) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send(orders);
	});
}

function transCommission(req, res) {
    var amount = Number(req.body.amount);
    amount = Math.floor(amount / 100) * 100;
    if (amount <= 0) {
        res.status(403);
        return res.send({error_msg:'佣金不足100'});
    } else {
        User.update({_id: req.user._id}, {$inc: {'finance.balance': amount, 'finance.commission':-amount}}, function (err, numberAffected, raw) {
            if (err) {
                logger.debug('transCommission error:' + err.toString());
                res.status(500);
                return res.send({error_msg:err.toString()});
            } else if (!numberAffected) {
                logger.debug('transCommission error nothing updated');
                res.status(400);
                return res.send({error_msg:'nothing updated'});
            }
            var data = {
                userID: req.user._id,
                userMobile: req.user.mobile,
                userBalance: req.user.finance.balance + amount,
                dealType: 14,
                amount: amount,
                status: 1,
                description: '佣金转入余额',
                payType: 6
            };
            Order.create(data, function (err, order) {
                if (err) {
                    logger.debug('transCommission error when create order:' + err.toString());
                    res.status(500);
                    return res.send({error_msg:err.toString()});
                }
                res.send({});
            });
        });
    }
}

function fetchReferUserList(req, res) {
    User.find({$and:[{refer:req.user.referName}, {refer:{$exists:true}}]}, function(err, users) {
        if (err) {
            logger.debug('fetchReferUserList error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send(users);
    });
}

function finishWeixinBandUser(req, res, next) {
    if (req.session.openID && req.body.mobile) {
        var auth = passport.authenticate('local', function(err, user, info) {
            if (err) {
                logger.warn('finishWeixinBandUser error when update db');
                res.status(500);
                return res.send({error_msg:err.toString()});
            }
            if (!user) {
                logger.warn('finishWeixinBandUser login error');
                res.status(403);
                if (info.error_code === 3) {
                    return res.send({error_msg:'你还不是牛金网用户'});
                } else {
                    return res.send({error_msg:'登录名或密码错误'});
                }
            }
            User.update({mobile:req.body.mobile}, {$set: {'profile.weixin_id':req.session.openID}}, function(err, numberAffected, raw) {
                if (err) {
                    logger.warn('finishWeixinBandUser error when update db');
                    res.status(500);
                    return res.send({error_msg:err.toString()});
                }
                if (!numberAffected) {
                    logger.warn('finishWeixinBandUser nothing update');
                    res.status(403);
                    return res.send({error_msg:'绑定失败，请稍后再试'});
                }
                res.send({});
            });
        });
        auth(req, res, next);
    } else {
        logger.warn('finishWeixinBandUser session not have openID or body not have mobile');
        res.status(403);
        return res.send({error_msg:'无法匹配用户'});
    }
}

function setIdentity(req, res) {
    var name = req.body.userName;
    var ID = req.body.userID;
    if (name && ID) {
        beifuIdentityVerify(req.user._id, name, ID, function(err) {
            if (err) {
                logger.error('setIdentity error:' + err.toString());
                res.status(403);
                return res.send({error_msg:'认证失败 ' + err.toString()});
            }
            User.update({mobile:req.user.mobile}, {$set:{'identity.name':name, 'identity.id':ID}}, function(err, numberAffected, raw) {
                if (err) {
                    logger.error('setIdentity error:' + err.toString());
                    res.status(500);
                    return res.send({error_msg:err.toString()});
                }
                if (!numberAffected) {
                    logger.error('setIdentity nothing to udate');
                    res.status(403);
                    return res.send({error_msg:'nothing to udate'});
                }
                res.send({});
            });
        });
    } else {
        logger.error('setIdentity error:invalid input');
        res.status(400);
        return res.send({error_msg:'无效的输入'});
    }
}

function beifuIdentityVerify(userID, userName, idNum, cb) {
    var md5key = 'DH7WNCLKEB7KM897T8YBUB6Y3ETO3Atykisu';

    var queryStr = "cert_id=" + idNum + "&input_charset=UTF-8&out_order_no=" + userID + "&partner=201504141356306494&service=ebatong_identity_auth&sign_type=MD5&user_name=" + userName;
    var sign1 = sparkMD5.hash(queryStr+md5key);
    queryStr += '&sign=' + sign1;
    var url = 'https://www.ebatong.com/auth/identityauth.htm?' + queryStr;

    var options = {
        follow_max         : 3    // follow up to five redirects
    };
    needle.get(encodeURI(url), options, function(err, resp, body) {
        if (err) {
            cb(err);
        } else {
            var parseString = xml2js.parseString;
            parseString(body, function (error, result) {
                if (error) {
                    cb(body);
                } else {
                    console.log(result.beifu.order[0]);
                    if (result.beifu.order[0].status[0] !== '0') {
                        cb(result.beifu.order[0].desc[0]);
                    } else {
                        cb(null);
                    }
                }
            });
        }
    });
}

function getInvestContract(req, res, next) {
    var sid = req.params.serial_id;
    if (!sid) {
        return next();
    }
    Contract.findOne(sid, function(err, contract) {
        if (err) {
            logger.warn('getInvestContract err:' + err.toString());
            return next();
        }
        if (!contract) {
            logger.warn('getInvestContract err contract not found:' + cid);
            return next();
        }
        res.render('mobile/invest_agreement', {
            layout: 'mobile',
            contractObj: contract,
            createdAt: moment(contract.createAt).format('YYYY年MM月DD日'),
            startTime: moment(contract.startTime).format('YYYY年MM月DD日'),
            endTime: moment(contract.endTime).format('YYYY年MM月DD日'),
            serviceFee: util.getServiceCharge(Math.floor(contract.amount/contract.deposit))
        });
    })
}

module.exports.registerRoutes = function(app, passportConf) {
    app.get('/user', passportConf.isAuthenticated, getUserHome);

    app.get('/recharge', passportConf.isAuthenticated, getRecharge);

    app.post('/pay_middle_step', passportConf.isAuthenticated, payMiddleStep);

    app.post('/user/verify_email_by_sms', passportConf.isAuthenticated, verifyEmailBySMS);

    app.post('/api/send_sms', passportConf.isAuthenticated, sendSMS);

    app.post('/user/beifu_get_dyncode', passportConf.isAuthenticated, beifuGetDynCode);

    app.post('/user/beifu_pay', passportConf.isAuthenticated, beifuPay);

    app.post('/user/set_identity', passportConf.isAuthenticated, setIdentity);

    app.post('/api/user/invest_update', passportConf.isAuthenticated, investUpdate);

    app.post('/api/user/invest_recharge', passportConf.isAuthenticated, rechargeToInvest);

    app.post('/api/user/invest_to_balance', passportConf.isAuthenticated, investToBalance);

    app.get('/api/user/invest_orders', passportConf.isAuthenticated, getInvestOrders);

    app.get('/api/user/invest_detail', passportConf.isAuthenticated, getUserInvestDetail);

    app.post('/user/api/transfer_commission', passportConf.isAuthenticated, transCommission);

    app.get('/user/api/refer_user_list', passportConf.isAuthenticated, fetchReferUserList);

    app.post('/api/weixin_band_user', finishWeixinBandUser);

    app.get('/contract/:serial_id', passportConf.isAuthenticated, getInvestContract);

    app.get('/user/*', passportConf.isAuthenticated, function(req, res, next) {
        res.locals.callback_domain = config.pay_callback_domain;
        res.render('user/' + req.params[0], {layout:null});
    });

    app.post('/test_sign', function(req, res, next) {
        var md5key = '9UCKYZ6Q804CO5O43TGHLMDO4YTU10hggixe';

        var timeStr = "input_charset=UTF-8&partner=201204201739476361&service=query_timestamp&sign_type=MD5";
        var sign1 = sparkMD5.hash(timeStr+md5key);
        timeStr += '&sign=' + sign1;
        var url = 'http://www.ebatong.com/gateway.htm?' + timeStr;

        var options = {
            follow_max         : 3    // follow up to five redirects
        };
        console.log(url);
        needle.get(url, options, function(err, resp, body) {
            //logger.debug(body.ebatong.response.timestamp.encrypt_key);
            var timestamp = body.ebatong.response.timestamp.encrypt_key;

            var data = _.assign({}, req.body);
            data.anti_phishing_key = timestamp;
            var keys = _.keys(data);
            keys = _.sortBy(keys);
            var str = '';
            for (var i = 0; i < keys.length-1; ++i) {
                str += keys[i] + '=' + data[keys[i]] + '&';
            }
            str += keys[i] + '=' + data[keys[i]];
            console.log(str+md5key);
            var sign = sparkMD5.hash(str+md5key);
            str += '&sign=' + sign;
            console.log(str);

            res.redirect('https://www.ebatong.com/direct/gateway.htm?' + str);
        });

        //res.send('got');
    });

    app.post('/test_sign2', function(req, res, next) {
        var md5key = 'ATWRX42FSTWJCMPVUBJSCSZN2T7OBZsdtkpu';

        var data = _.assign({}, req.body);
        var keys = _.keys(data);
        keys = _.sortBy(keys);
        var sendData = {};
        var str = '';
        for (var i = 0; i < keys.length-1; ++i) {
            str += keys[i] + '=' + data[keys[i]] + '&';
            sendData[keys[i].toString()] = data[keys[i]];
        }
        str += keys[i] + '=' + data[keys[i]];
        sendData[keys[i].toString()] = data[keys[i]];
        var sign = sparkMD5.hash(str+md5key);
        sendData['sign'] = sign;
        str += '&sign=' + sign;
        console.log(sendData);
        var url = 'https://www.ebatong.com/mobileFast/getDynNum.htm';

        var objData = {
            'amount': '3.20',
            'bank_code': 'CMB_D_B2C',
            'card_bind_mobile_phone_no': '13439695920',
            'card_no': '6226090104776295',
            'cert_no': '620102198108041833',
            'cert_type': '01',
            'customer_id': '552e4252333bf12c75ce09e8',
            'input_charset': 'UTF-8',
            'out_trade_no': '2015041217271095',
            'partner': '201206281102516718',
            'real_name': '程翔',
            'service': 'ebatong_mp_dyncode',
            'sign_type': 'MD5',
            'sign': '92cc9daa328e76461e0052ccc446e2cb' };

        console.log(objData);

        var options = {
            json: true,
            follow_max         : 3    // follow up to five redirects
        };
        needle.post(url, objData, options, function(err, resp, body) {
            console.log(body);
            /*
            var timestamp = body.ebatong.response.timestamp.encrypt_key;

            var data = _.assign({}, req.body);
            data.anti_phishing_key = timestamp;
            var keys = _.keys(data);
            keys = _.sortBy(keys);
            var str = '';
            for (var i = 0; i < keys.length-1; ++i) {
                str += keys[i] + '=' + data[keys[i]] + '&';
            }
            str += keys[i] + '=' + data[keys[i]];
            console.log(str+md5key);
            var sign = sparkMD5.hash(str+md5key);
            str += '&sign=' + sign;
            console.log(str);

            res.redirect('https://www.ebatong.com/direct/gateway.htm?' + str);
            res.send({});
            */
            res.send({});
        });
    });
};

var privateProperties = [
    '__v',
    'verifyEmailToken',
    'registered',
    'roles',
    'password',
    'manager',
    'resetPasswordToken',
    'resetPasswordExpires'
];

function getUserViewModel(user){
    var realUser = user._doc;
    var vm = _.omit(realUser, privateProperties);
    return _.extend(vm, {});
}

module.exports.fetchUser = function(req, res) {
    if (req.params.id != req.user._id) {
        logger.info('fetchUser invalid user');
        res.status(401);
        return res.send({error_msg:'invalid user'});
    }
    User.findById(req.params.id, function(err, user) {
        if (err) {
            logger.error('fetchUser error:' + err.toString());
            res.status(503);
            return res.send({});
        }
        if (!user) {
            logger.error('fetchUser error user not found:' + req.params.id);
            res.status(400);
            return res.send({});
        }
        res.send(getUserViewModel(user));
    });
};

module.exports.fetchAppliesForUser = function(req, res) {
    Apply.find({userID:req.params.uid}, function(err, applies) {
        if (err) {
            logger.debug('error when fetchAppliesForUser:' + err.toString());
            res.status(503);
            return res.send({});
        }
        res.send(applies);
    });
};

module.exports.fetchApplyForUser = function(req, res) {
    if (req.user._id != req.params.uid) {
        res.status(401);
        return res.send({});
    }
    Apply.findOne({serialID:req.params.serial_id}, function(err, apply) {
        if (err) {
            logger.debug('error when fetchApplyForUser:' + err.toString());
            res.status(503);
            return res.send({});
        }
        res.send(apply);
    });
};

function getRecharge(req, res, next) {
    var order_id = req.query.order_id;
    if (!order_id) {
        return next();
    }
    util.debugInfo(logger, req);
    Order.findById(order_id, function(err, order) {
        if (err || !order) {
            logger.warn('getRecharge2 err:' + err.toString());
            return next();
        }
        res.locals.title = '充值中心';
        res.locals.recharge = true;
        res.locals.user_mobile = util.mobileDisplay(req.user.mobile);
        res.locals.callback_domain = config.pay_callback_domain;
        res.render('recharge', {
            layout: 'no_header',
            bootstrappedUserObject: JSON.stringify(getUserViewModel(req.user)),
            bootstrappedOrderObject: JSON.stringify(order)
        });
    });
}

module.exports.payByBalance = function(req, res, next) {
    if (!req.user) {
        res.status(400);
        return res.send({error_msg:'无效的用户!'});
    }
    var data = req.body;

    util.debugInfo(logger, req);
    async.waterfall([
        function(callback) {
            User.findById(req.user._id, function(err, user) {
                if (!user) {
                    logger.warn('payByBalance error. user not found:' + data.apply_serial_id);
                    err = 'payByBalance error. user not found:' + data.apply_serial_id;
                }
                callback(err, user);
            })
        },
        function(user, callback) {
            Apply.findOne({serialID:data.apply_serial_id}, function(err, apply) {
                if (!apply) {
                    logger.warn('payByBalance error. apply not found:' + data.apply_serial_id);
                    err = 'payByBalance error. apply not found:' + data.apply_serial_id;
                }
                callback(err, user, apply);
            });
        },
        function(user, apply, callback) {
            util.applyConfirmed(user, apply, function(err) {
                callback(err);
            })
        }
    ], function(err) {
        if (err) {
            logger.warn('payByBalance error:' + err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        res.send({});
    });
};

module.exports.getVerifyImg = function(req, res) {
    var ary = ccap.get();
    var txt = ary[0];
    var buf = ary[1];
    req.session.img_code = txt.toLowerCase();
    res.send(buf);
};

module.exports.submitComplain = function(req, res) {
    req.assert('title', '标题不能为空').notEmpty();
    req.assert('content', '内容不能为空').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/complain');
    }
    var data = {
        userMobile: '00000000001',
        title: req.body.title,
        content: req.body.content,
        writer: req.user.mobile
    };
    Note.create(data, function (err, note) {
        res.redirect('/');
    });
};
