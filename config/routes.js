var users = require('../controllers/user'),
    cards = require('../controllers/card'),
    orders = require('../controllers/order'),
    applies = require('../controllers/apply'),
    sms = require('../lib/sms'),
    admin = require('../controllers/admin'),
    passportConf = require('./passport');

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.locals.user = req.user;
        next();
    });

    app.get('/', function(req, res) {
        res.locals.main_menu = true;
        res.render('home');
    });

    app.get('/apply_confirm/:id', passportConf.isAuthenticated, applies.confirmApply);

    app.get('/third_party_pay', function(req, res) {
        res.render('third_party_pay', {layout:null});
    });

    app.get('/failed_to_pay', function(req, res) {
        res.locals.pay_error = req.session.pay_error;
        req.session.pay_error = null;
        res.render('failed_to_pay');
    });

    app.get('/support_contact', function(req, res) {
        res.render('support_contact');
    });

    app.get('/apply_detail/:id', passportConf.isAuthenticated, applies.getApplyDetail);

    app.get('/company_intro', function(req, res) {
        res.render('article/company_intro', {layout:'article_main'});
    });

    app.get('/QandA', function(req, res) {
        res.render('article/QandA', {layout:'article_main'});
    });

    app.get('/guidelines', function(req, res) {
        res.render('article/guidelines', {layout:'article_main'});
    });

    app.get('/contact', function(req, res) {
        res.render('article/contact', {layout:'article_main'});
    });

    app.get('/legal', function(req, res) {
        res.render('article/legal', {layout:'article_main'});
    });

    app.get('/partners', function(req, res) {
        res.render('article/partners', {layout:'article_main'});
    });

    app.get('/thank_you_for_pay', users.thankYouForPay);

    app.post('/thank_you_for_pay', users.thankYouForPay);

    app.get('/signup', function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/');
        } else {
            res.render('register/signup');
        }
    });

    app.post('/signup', users.postSignup);

    app.get('/forgot', function(req, res) {
        res.render('register/forgot');
    });

    app.post('/forgot', users.resetPassword);

    app.get('/apply', applies.getApplyPage);

    app.post('/apply', applies.placeApply);

    app.get('/login', function (req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/');
        } else {
            res.render('register/login');
        }
    });

    app.post('/login', users.postLogin);

    app.get('/logout', users.logout);

    app.post('/logout', users.postLogout);

    app.get('/user', passportConf.isAuthenticated, users.getIndex);

    app.get('/user/home', passportConf.isAuthenticated, users.getHome);

    app.get('/user/profile', passportConf.isAuthenticated, users.getProfile);

    app.get('/user/orders', passportConf.isAuthenticated, users.getOrders);

    app.get('/user/security', passportConf.isAuthenticated, users.getSecurity);

    app.get('/user/identity', passportConf.isAuthenticated, users.getIdentity);

    app.get('/user/mypay', passportConf.isAuthenticated, users.getUserPay);

    app.get('/user/withdraw', passportConf.isAuthenticated, users.getWithdraw);

    app.get('/user/verify_email', passportConf.isAuthenticated, users.getVerifyEmail);

    app.post('/user/verify_email', passportConf.isAuthenticated, users.postVerifyEmail);

    app.get('/user/change_pass', passportConf.isAuthenticated, users.getResetPassword);

    app.post('/user/change_pass', passportConf.isAuthenticated, users.postUpdatePassword);

    app.get('/user/change_finance_pass', passportConf.isAuthenticated, users.getResetFinancePassword);

    app.post('/user/change_finance_pass', passportConf.isAuthenticated, users.postUpdateFinancePassword);

    app.get('/user/apply_list', passportConf.isAuthenticated, users.getApplyList);

    app.post('/user/verify_finance_password', passportConf.isAuthenticated, users.verifyFinancePassword);

    app.post('/api/users/pay_by_balance', passportConf.isAuthenticated, users.payByBalance);

    app.get('/pay_confirm/:orderID', passportConf.isAuthenticated, orders.confirmPayOrder);

    app.get('/api/users/:id', users.getUser);

    app.post('/api/users/update_balance', passportConf.isAuthenticated, users.updateBalance);

    app.post('/api/users/:id', passportConf.isAuthenticated, users.updateUser);

    app.get('/api/cards/:uid', cards.getCardsForUser);

    app.post('/api/cards', cards.addCard);

    app.get('/api/orders/:id', orders.getOrderById);

    app.get('/api/user/:uid/orders', orders.fetchOrdersForUser);

    app.post('/api/user/:uid/orders', orders.addOrderForUser);

    app.post('/api/orders/:id', orders.updateOrder);

    app.get('/api/send_sms_verify_code', users.sendVerifyCode);

    app.get('/api/applies/:uid/apply', applies.getAppliesForUser);

    app.post('/api/user_pay', users.getPayTransid);

    app.post('/api/pay_feedback', users.payFeedback);

    app.post('/api/users/pay_success/:order_id', passportConf.isAuthenticated, users.paySuccess);

    app.post('/api/shengpay_feedback', users.shengpayFeedback2);

    admin.registerRoutes(app, passportConf);
};
