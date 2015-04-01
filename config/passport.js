var mongoose = require("mongoose"),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
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
    req.session.lastLocation = req.url;
    res.redirect('/login');
};

module.exports.requiresRole = function(role) {
    return function (req, res, next) {
        var role_arr = role.split('|');
        var match = false;
        for (r in role_arr) {
          if (req.user.roles.indexOf(role_arr[r]) !== -1) {
            match = true;
            break;
          }
        }
        if (!req.isAuthenticated() || !match) {
            res.status(403);
            res.end('需要管理员权限');
        } else {
            next();
        }
    }
};
