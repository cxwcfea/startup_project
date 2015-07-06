var mongoose = require("mongoose"),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    wechatStrategy = require('passport-wechat'),
    util = require('../lib/util'),
    env = process.env.NODE_ENV,
    config = require('../config/config')[env],
    User = mongoose.model('User');

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
    appid: 'wx33d7e57b1d15b1d3',
    appsecret: '87fb0f8440e3f1d071d383abc3a6507a',
    callbackURL: config.pay_callback_domain + '/auth/wechat/callback',
    scope: 'snsapi_login',
    state: true
}, function (openid, profile, token, done) {
    console.log('wechat openid:' + openid + ' profile:' + util.printObject(profile) + ' token:' + util.printObject(token));
    var userObj = {
        mobile: 11111111111,
        password: 'xxxxxx',
        profile: {
            weixin_id: openid,
            wechat_uuid: profile.unionid
        }
    };
    User.create(userObj, function(err, user) {
        if (err) {
            done(err);
        } else {
            return done(null, user, profile);
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
