var users = require('../controllers/user'),
    cards = require('../controllers/card'),
    orders = require('../controllers/order'),
    applies = require('../controllers/apply'),
    sms = require('../lib/sms'),
    admin = require('../controllers/admin'),
    util = require('../lib/util'),
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

    app.get('/failed_to_pay', function(req, res) {
        res.locals.pay_error = req.session.pay_error;
        req.session.pay_error = null;
        res.render('failed_to_pay');
    });

    app.get('/recharge', passportConf.isAuthenticated, users.getRecharge);

    app.get('/apply_detail/:id', passportConf.isAuthenticated, applies.getApplyDetail);

    app.get('/apply/get_profit/:serial_id', passportConf.isAuthenticated, applies.getProfit);

    app.post('/apply/get_profit/:serial_id', passportConf.isAuthenticated, applies.postGetProfit);

    app.get('/apply/add_deposit/:serial_id', passportConf.isAuthenticated, applies.getAddDeposit);

    app.post('/apply/add_deposit/:serial_id', passportConf.isAuthenticated, applies.postAddDeposit);

    app.get('/apply/apply_postpone/:serial_id', passportConf.isAuthenticated, applies.getApplyPostpone);

    app.post('/apply/apply_postpone/:serial_id', passportConf.isAuthenticated, applies.postApplyPostpone);

    app.get('/thank_you_for_pay', users.thankYouForPay);

    app.post('/thank_you_for_pay', users.thankYouForPay);

    app.get('/free_apply', function(req, res, next) {
        res.locals.free_apply_menu = true;
        res.render('apply/free_apply');
    });

    app.get('/signup', function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/');
        } else {
            res.locals.title = '注册';
            res.locals.signup = true;
            res.render('register/signup', {
                layout: 'no_header'
            });
        }
    });

    app.post('/signup', users.postSignup);

    app.post('/signup_2', users.preSignup);

    app.post('/api_signup', users.apiSignup);

    app.post('/verify_mobile_code', users.verifyMobileCode);

    app.get('/forgot', function(req, res) {
        res.locals.other_menu = true;
        res.render('register/forgot');
    });

    app.post('/forgot', users.resetPassword);

    app.get('/apply', applies.getApplyPage);

    app.post('/apply', applies.placeApply);

    app.get('/free_apply_confirm', passportConf.isAuthenticated, applies.freeApply);

    app.get('/login', function (req, res) {
        console.log('get login');
        if (req.isAuthenticated()) {
            res.redirect('/');
        } else {
            res.locals.title = '登录';
            res.locals.login = true;
            res.render('register/login', {
                layout: 'no_header'
            });
        }
    });

    app.post('/login', users.postLogin);

    app.post('/api/login', users.ajaxLogin);

    app.get('/logout', users.logout);

    app.post('/logout', users.postLogout);

    /*
    app.get('/user', passportConf.isAuthenticated, users.getIndex);
    */

    app.get('/user/home', passportConf.isAuthenticated, users.getHome);

    app.get('/user/profile', passportConf.isAuthenticated, users.getProfile);

    app.get('/user/orders', passportConf.isAuthenticated, users.getOrders);

    app.get('/user/security', passportConf.isAuthenticated, users.getSecurity);

    app.get('/user/identity', passportConf.isAuthenticated, users.getIdentity);

    app.get('/user/mypay', passportConf.isAuthenticated, users.getUserPay);

    app.get('/user/withdraw', passportConf.isAuthenticated, users.getWithdraw);

    app.post('/user/withdraw', passportConf.isAuthenticated, users.postWithdraw);

    app.get('/user/verify_email', passportConf.isAuthenticated, users.getVerifyEmail);

    app.post('/user/verify_email', passportConf.isAuthenticated, users.postVerifyEmail);

    app.get('/user/verifyEmail/:token', passportConf.isAuthenticated, users.finishVerifyEmail);

    app.get('/user/change_pass', passportConf.isAuthenticated, users.getResetPassword);

    app.post('/user/change_pass', passportConf.isAuthenticated, users.postUpdatePassword);

    app.get('/user/change_finance_pass', passportConf.isAuthenticated, users.getResetFinancePassword);

    app.post('/user/change_finance_pass', passportConf.isAuthenticated, users.postUpdateFinancePassword);

    app.get('/user/apply_list', passportConf.isAuthenticated, users.getApplyList);

    app.post('/user/verify_finance_password', passportConf.isAuthenticated, users.verifyFinancePassword);

    app.get('/user/apply_close', passportConf.isAuthenticated, applies.getCloseApply);

    app.post('/user/apply_close/:serial_id', passportConf.isAuthenticated, applies.postCloseApply);

    app.post('/user/iapp_pay', users.getIAppPayTransid);

    app.post('/api/users/pay_by_balance', passportConf.isAuthenticated, users.payByBalance);

    app.get('/pay_confirm/:orderID', passportConf.isAuthenticated, orders.confirmPayOrder);

    app.get('/api/users/:id', users.getUser);

    app.post('/api/users/update_balance', passportConf.isAuthenticated, users.updateBalance);

    app.post('/api/users/:id', passportConf.isAuthenticated, users.updateUser);

    app.get('/api/cards/:uid', cards.getCardsForUser);

    app.post('/api/cards', cards.addCard);

    app.get('/api/orders/:id', orders.getOrderById);

    app.get('/api/user/:uid/orders', passportConf.isAuthenticated, orders.fetchOrdersForUser);

    app.post('/api/user/:uid/orders', orders.addOrderForUser);

    app.get('/api/user/:uid/orders/:id', passportConf.isAuthenticated, orders.fetchOrderForUser);

    app.post('/api/orders/:id', orders.updateOrder);

    app.get('/api/send_sms_verify_code', users.sendVerifyCode);

    app.get('/api/applies/:uid/apply', applies.getAppliesForUser);

    app.post('/api/iapp_feedback', users.iappPayFeedback);

    app.post('/api/shengpay_feedback', users.shengpayFeedback);

    app.post('/api/add_forbidden_stock', function(req, res) {
        var data = req.body;
        data = JSON.parse(data.data);
        util.addForbiddenStocks(data);
        res.send('OK');
    });

    app.get('/api/fetch_forbidden_stocks', function(req, res) {
        util.fetchForbiddenStocks(function(err, stocks) {
            res.send(stocks);
        });
    });

    admin.registerRoutes(app, passportConf);

    app.get('/apply_confirm/:serial_id', passportConf.isAuthenticated, applies.confirmApply);

    app.post('/apply_confirm', passportConf.isAuthenticated, applies.postConfirmApply);

    app.get('/apply/pay_success', passportConf.isAuthenticated, applies.paySuccess);

    users.registerRoutes(app, passportConf);

    app.get('/api/user/:id', passportConf.isAuthenticated, users.fetchUser);

    app.post('/api/user/:id', passportConf.isAuthenticated, users.updateUser);

    app.get('/api/user/:uid/applies', passportConf.isAuthenticated, users.fetchAppliesForUser);

    app.get('/api/user/:uid/applies/:serial_id', passportConf.isAuthenticated, users.fetchApplyForUser);

    app.get('/info/*', function(req, res) {
        res.locals.other_menu = true;
        res.render('info/' + req.params[0]);
    });

    app.get('/admin_test', passportConf.requiresRole('admin'), function(req, res, next) {
        res.render('admin_test');
    });

    function getClientIp(req) {
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    }

    app.post('/testpay', function(req, res, nest) {
        console.log(req.body);
        console.log('client ip:' + req.ip);
        console.log(getClientIp(req));
        res.send({});
    });
};
