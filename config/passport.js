var mongoose = require("mongoose"),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = mongoose.model('User');

passport.use(new LocalStrategy({ usernameField: 'mobile' },
    function(mobile, password, done) {
        User.findOne({ mobile: mobile }, function(err, user) {
            if (err) { return done(err); }
            if (!user) return done(null, false, { message: '手机号码 ' + mobile + ' 不存在'});
            user.comparePassword(password, function(err, isMatch) {
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: '密码错误.' });
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
    res.redirect('/login');
};
