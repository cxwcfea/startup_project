var passport = require('passport'),
    User = require('../models/User'),
    userViewModel = require('../viewModels/user');

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
            res.redirect('/user/index');
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
                res.redirect('/user/index');
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

module.exports.getIdentity = function(req, res) {
    res.render('user/identity', {layout:null});
};

module.exports.getUserPay = function(req, res) {
    res.render('user/mypay', {layout:null});
};

module.exports.getWithdraw = function(req, res) {
    res.render('user/withdraw', {layout:null});
};

module.exports.getUser = function(req, res, next) {
    User.findById(req.params.id, function(err, user) {
        if (err) next(err);
        res.send(user);
    });
};

module.exports.updateUser = function(req, res, next) {
    var userData = req.body;
    User.update({_id:req.params.id}, userData, function (err, numberAffected, raw) {
        if (err) next(err);
        res.send({success:true});
    });
};
