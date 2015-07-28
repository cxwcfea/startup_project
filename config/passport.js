var mongoose = require("mongoose"),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    wechatStrategy = require('passport-wechat'),
    util = require('../lib/util'),
    env = process.env.NODE_ENV,
    config = require('../config/config')[env],
    User = mongoose.model('User'),
    mockTrader = require('../controllers/mockTrader');

function generateRandomMobile(len) {
    var ret = util.getRandomInt(1, 9);
    for (var i = 1; i < len; ++i) {
        ret *= 10;
        ret += util.getRandomInt(0, 9);
    }
    return ret;
}

passport.use(new LocalStrategy({ usernameField: 'mobile' },
    function(mobile, password, done) {
        User.findOne({ mobile: mobile }, function(err, user) {
            if (err) { return done(err); }
            if (!user || !user.registered) return done(null, false, { error_code:3, message: '手机号码 ' + mobile + ' 还未注册'});
            user.comparePassword(password, function(err, isMatch) {
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { error_code:2, message: '密码错误.' });
                }
            });
        });
    }
));

passport.use(new wechatStrategy({
    appid: config.wechatAppId,
    appsecret: config.wechatSecret,
    callbackURL: config.ppj_callback_domain + '/auth/wechat/callback',
    scope: 'snsapi_login',
    state: true
}, function (openid, profile, token, done) {
    console.log('wechat openid:' + openid + ' profile:' + util.printObject(profile) + ' token:' + util.printObject(token));
    User.findOne({'wechat.wechat_uuid':profile.unionid}, function(err, user) {
        if (err) {
            console.log('wechat login find user err:' + err.toString());
            done(err);
        } else if (!user) {
            console.log('wechat login not found user with unionid:' + profile.unionid);
            mockTrader.createUser({
                name: profile.unionid,
                close: 50000000,
                cash: 100000000,
                deposit: 50000000,
                debt: 50000000
            }, function(err, trader) {
                if (err) {
                    done(err);
                }
                var userObj = {
                    mobile: generateRandomMobile(10),
                    password: 'xxxxxx',
                    score: 5,
                    roles: ['wechat'],
                    wechat: {
                        wechat_uuid: profile.unionid,
                        wechat_name: profile.nickname,
                        wechat_img: profile.headimgurl,
                        trader: trader
                    }
                };
                User.create(userObj, function(err, user) {
                    done(err, user, profile);
                });
            });
        } else {
            console.log('wechat login found user with unionid:' + profile.unionid);
            if (!user.wechat.logged) {
                user.wechat.logged = true;
                user.score += 5;
                user.save(function(err) {
                    done(err, user, profile);
                });
            } else {
                done(null, user, profile);
            }
        }
    });
}));

passport.serializeUser(function(user, done) {
    if (user) {
        done(null, user._id);
    }
});

passport.deserializeUser(function(id, done) {
    User.findOne({_id:id}).exec(function(err, user) {
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    })
});

/**
 * Login Required middleware.
 */
module.exports.isAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) return next();
    if (req.url.search('/mobile') > -1) {
        res.redirect('/mobile/#/login');
    } else {
        req.session.lastLocation = req.url;
        if (req.url.search('free_apply_confirm') > -1) {
            res.redirect('/signup');
        } else {
            res.redirect('/login');
        }
    }
};

module.exports.requiresRole = function(role) {
    return function (req, res, next) {
        var role_arr = role.split('|');
        var match = false;
        if (req.user && req.user.roles) {
          for (r in role_arr) {
            if (req.user.roles.indexOf(role_arr[r]) !== -1) {
              match = true;
              break;
            }
          }
        }
        if (!req.isAuthenticated() || !match) {
            res.status(403);
            //res.end('需要管理员权限');
            req.session.lastLocation = '/admin';
            res.render('admin/admin_login', {
                layout: null
            });
        } else {
            next();
        }
    }
};

module.exports.isWechatAuthenticated = function(req, res, next) {
    if (!req.isAuthenticated() || !req.user.wechat.wechat_uuid) {
        res.redirect('/auth/wechat');
    } else {
        next();
    }
};
