var mongoose = require("mongoose"),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = mongoose.model('User');

module.exports = function() {
    passport.use(new LocalStrategy({ usernameField: 'mobile' },
        function(mobile, password, done) {
            User.findOne({ mobile: mobile }, function(err, user) {
                if (err) { return done(err); }
                if (!user) return done(null, false, { message: 'User ' + mobile + ' not found'});
                user.comparePassword(password, function(err, isMatch) {
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Invalid mobile or password.' });
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
};
