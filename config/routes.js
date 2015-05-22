var users = require('../controllers/user'),
    cards = require('../controllers/card'),
    orders = require('../controllers/order'),
    applies = require('../controllers/apply'),
    home = require('../controllers/home'),
    mobile = require('../controllers/mobile'),
    sms = require('../lib/sms'),
    admin = require('../controllers/admin'),
    util = require('../lib/util'),
    weixin = require('../lib/weixin'),
    log4js = require('log4js'),
    logger = log4js.getLogger('routes'),
    needle = require('needle'),
    ecitic = require("../lib/ecitic"),
    xml = require("xml"),
    xml2js = require("xml2js"),
    passportConf = require('./passport');

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.locals.user = req.user;
        res.locals.lastLogin = req.session.lastLogin;
        if (req.session.statistic) {
            res.locals.recentApply = req.session.statistic.show_applies[0];
        }
        if (process.env.NODE_ENV === 'production') {
            res.locals.production = true;
        }
        next();
    });

    home.registerRoutes(app, passportConf);

    app.get('/failed_to_pay', function(req, res) {
        res.locals.pay_error = req.session.pay_error;
        req.session.pay_error = null;
        res.render('failed_to_pay');
    });

    app.get('/welcome', passportConf.isAuthenticated, function(req, res, next) {
        util.debugInfo(logger, req);
        res.locals.title = '用户注册';
        res.locals.signup = true;
        res.locals.uid = req.user._id;
        res.render('register/success', {
            layout: 'no_header'
        });
    });

    app.get('/complain', passportConf.isAuthenticated, function(req, res, next) {
        res.render('complain');
    });

    app.post('/complain', passportConf.isAuthenticated, users.submitComplain);

    app.get('/apply_detail/:id', passportConf.isAuthenticated, applies.getApplyDetail);

    //app.get('/apply/get_profit/:serial_id', passportConf.isAuthenticated, applies.getProfit);

    app.post('/apply/get_profit/:serial_id', passportConf.isAuthenticated, applies.postGetProfit);

    //app.get('/apply/add_deposit/:serial_id', passportConf.isAuthenticated, applies.getAddDeposit);

    //app.post('/apply/add_deposit/:serial_id', passportConf.isAuthenticated, applies.postAddDeposit);

    app.post('/apply/add_deposit/:serial_id', passportConf.isAuthenticated, applies.addDeposit);

    app.get('/apply/apply_postpone/:serial_id', passportConf.isAuthenticated, applies.getApplyPostpone);

    app.post('/apply/apply_postpone/:serial_id', passportConf.isAuthenticated, applies.postApplyPostpone);

    app.get('/free_apply', function(req, res, next) {
        res.locals.free_apply_menu = true;
        res.render('apply/free_apply');
    });

    app.get('/signup', function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/');
        } else {
            res.locals.title = '用户注册';
            res.locals.signup = true;
            res.render('register/signup', {
                layout: 'no_header'
            });
        }
    });

    app.post('/finish_signup', users.finishSignup);

    app.post('/api/signup', users.apiSignup);

    app.post('/verify_mobile_code', users.verifyMobileCode);

    app.get('/forgot', function(req, res) {
        util.debugInfo(logger, req);
        res.locals.other_menu = true;
        res.render('register/forgot');
    });

    app.post('/forgot', users.resetPassword);

    app.post('/user/reset_pass', passportConf.isAuthenticated, users.postUpdatePassword);

    //app.get('/yyn', applies.getYYnPage);

    app.get('/apply', applies.getApplyPage);

    app.post('/apply', applies.placeApply);

    app.get('/free_apply_confirm', passportConf.isAuthenticated, applies.freeApply);

    app.get('/login', function (req, res) {
        util.debugInfo(logger, req);
        if (req.isAuthenticated()) {
            res.redirect('/');
        } else {
            res.locals.title = '用户登录';
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

    app.post('/user/withdraw', passportConf.isAuthenticated, users.postWithdraw);

    app.post('/user/verify_email', passportConf.isAuthenticated, users.postVerifyEmail);

    app.get('/user/verifyEmail/:token', passportConf.isAuthenticated, users.finishVerifyEmail);

    app.post('/user/change_finance_pass', passportConf.isAuthenticated, users.postUpdateFinancePassword);

    app.get('/user/apply_list', passportConf.isAuthenticated, users.getApplyList);

    app.post('/user/verify_finance_password', passportConf.isAuthenticated, users.verifyFinancePassword);

    app.get('/user/apply_close', passportConf.isAuthenticated, applies.getCloseApply);

    app.post('/user/apply_close/:serial_id', passportConf.isAuthenticated, applies.postCloseApply);

    app.post('/user/iapp_pay', users.getIAppPayTransid);

    app.post('/api/users/pay_by_balance', passportConf.isAuthenticated, users.payByBalance);

    app.get('/pay_confirm/:orderID', passportConf.isAuthenticated, orders.confirmPayOrder);

    app.get('/api/cards/:uid', passportConf.isAuthenticated, cards.getCardsForUser);

    app.post('/api/cards', passportConf.isAuthenticated, cards.addCard);

    app.post('/api/delete/card/:id', passportConf.isAuthenticated, cards.deleteCard);

    app.get('/api/orders/:id', orders.getOrderById);

    app.get('/api/user/:uid/orders', passportConf.isAuthenticated, orders.fetchOrdersForUser);

    app.post('/api/user/:uid/orders', orders.addOrderForUser);

    app.post('/api/user/:uid/orders/:id', orders.updateOrder);

    app.get('/api/user/:uid/orders/:id', passportConf.isAuthenticated, orders.fetchOrderForUser);

    app.post('/api/orders/:id', orders.updateOrder);

    app.get('/api/send_sms_verify_code', users.sendVerifyCode);

    app.get('/api/applies/:uid/apply', applies.getAppliesForUser);

    app.post('/api/iapp_feedback', users.iappPayFeedback);

    app.post('/api/shengpay_feedback', users.shengpayFeedback);

    app.post('/api/beifu_feedback', users.beifuFeedback);

    app.get('/api/beifu_withdraw_feedback', users.beifuWithdrawFeedback);

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

    //app.get('/yyn_confirm/:serial_id', passportConf.isAuthenticated, applies.yynConfirmApply);

    app.post('/apply_confirm', passportConf.isAuthenticated, applies.postConfirmApply);

    app.get('/apply/pay_success', passportConf.isAuthenticated, applies.paySuccess);

    users.registerRoutes(app, passportConf);

    app.get('/api/user/:id', passportConf.isAuthenticated, users.fetchUser);

    app.post('/api/users/:id', passportConf.isAuthenticated, users.updateUser);

    app.post('/api/user/:id', passportConf.isAuthenticated, users.updateUser);

    app.get('/api/user/:uid/applies', passportConf.isAuthenticated, users.fetchAppliesForUser);

    app.get('/api/user/:uid/applies/:serial_id', passportConf.isAuthenticated, users.fetchApplyForUser);

    app.get('/api/weixin/check_signature', weixin.checkSignature);

    app.post('/api/weixin/check_signature', weixin.handlePostMessage);

    app.get('/info/*', function(req, res) {
        res.locals.other_menu = true;
        res.render('info/' + req.params[0]);
    });

    app.get('/yyn', function(req, res) {
        res.locals.yyn_menu = true;
        res.render('apply/yyn2');
    });

    app.get('/yyn_confirm/:serial_id', passportConf.isAuthenticated, applies.yynConfirmApply2);

    mobile.registerRoutes(app, passportConf);

    app.get('/api/get_verify_img', users.getVerifyImg);

    /*
    app.get('/admin_test', passportConf.requiresRole('admin'), function(req, res, next) {
        util.debugInfo(logger, req);
        res.render('admin_test');
    });
    */

    app.get('/test', function(req, res, next) {
        var data = xml({stream: [{action:'DLBALQRY'}, {userName:'XNPH'}, {list: [{ _attr: { name: 'userDataList' }}, {row:[{accountNo:'7111010182600196886'}]}]}]}, { declaration: { version: '1.0', encoding: 'GBK' }});

        //var data = xml({stream: [{action:'DLOBKQRY'}, {userName:'XNPH'}]}, { declaration: { version: '1.0', encoding: 'GBK' }});

        /*
        var data = xml({stream: [{action:'DLOUTTRN'}, {userName:'XNPH'}, {clientID:'555d518446da0f03'}, {preFlg:'0'}, {payType:'05'},
            {recBankNo:'302100011000'}, {payAccountNo:'7111010182600196886'}, {recAccountNo:'7111010192087007800'},
            {recAccountName:'对私测试客户'}, {citicbankFlag:'1'}, {cityFlag:'1'}, {tranAmount:1}]}, { declaration: { version: '1.0', encoding: 'GBK' }});
            */
        //var data = xml({stream: [{action:'DLCIDSTT'}, {userName:'XNPH'}, {clientID:'555d518446da0f03'}]}, { declaration: { version: '1.0', encoding: 'GBK' }});

        console.log(data);
        var url = 'http://10.0.0.4:5128';
        var options = {
            json: true,
            follow_max: 3 // follow up to three redirects
        };
        needle.post(url, data, {}, function(err, resp, body) {
            console.log(err);
            console.log(body);
            var parseString = xml2js.parseString;
            parseString(body, function (err, result) {
                console.dir(result);
                if (result.stream.status[0] === 'AAAAAAA') {
                    console.log('success');
                }
            });
        });
        //var data = ecitic.generatePayCode('abcd', 'bank', 'card', 'name', 8);
        res.send({data:data});
    });
};
