var passport = require('passport'),
    User = require('../models/User');

module.exports.postLogin = function(req, res, next) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/login');
    }

    var auth = passport.authenticate('local', function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.send({success:false});
        }
        req.login(user, function(err) {
            if (err) {return next(err);}
            res.redirect('/profile');
        });
    });
    auth(req, res, next);
};

module.exports.postSignup = function(req, res, next) {
    req.assert('mobile', '无效的手机号码').len(11, 11).isInt();
    req.assert('password', '密码不能为空').notEmpty();
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
                res.redirect('/');
            });
        });
    });
};

module.exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

module.exports.getProfile = function(req, res) {
    res.render('user/profile');
}

/**
 * Login Required middleware.
 */
module.exports.isAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};
