var users = require('../controllers/user'),
    cards = require('../controllers/card'),
    orders = require('../controllers/order'),
    sms = require('../lib/sms'),
    passportConf = require('./passport');


module.exports = function(app) {
    app.use(function(req, res, next) {
        res.locals.user = req.user;
        next();
    });

    app.get('/', function(req, res) {
        res.render('home');
    });

    app.get('/signup', function(req, res) {
        res.render('register/signup');
    });

    app.post('/signup', users.postSignup);

    app.get('/login', function (req, res) {
        res.render('register/login');
    });

    app.get('/forgot', function(req, res) {
        res.render('register/forgot');
    });

    app.post('/forgot', users.resetPassword);

    app.post('/login', users.postLogin);

    app.get('/logout', users.logout);

    app.post('/logout', users.postLogout);

    app.get('/user/index', passportConf.isAuthenticated, users.getIndex);

    app.get('/user/home', passportConf.isAuthenticated, users.getHome);

    app.get('/user/profile', passportConf.isAuthenticated, users.getProfile);

    app.get('/user/orders', passportConf.isAuthenticated, users.getOrders);

    app.get('/user/security', passportConf.isAuthenticated, users.getSecurity);

    app.get('/user/identity', passportConf.isAuthenticated, users.getIdentity);

    app.get('/user/mypay', passportConf.isAuthenticated, users.getUserPay);

    app.get('/user/withdraw', passportConf.isAuthenticated, users.getWithdraw);

    app.get('/user/verify_email', passportConf.isAuthenticated, users.getVerifyEmail);

    app.get('/user/change_pass', passportConf.isAuthenticated, users.getResetPassword);

    app.post('/user/change_pass', passportConf.isAuthenticated, users.postUpdatePassword);

    app.get('/api/users/:id', users.getUser);

    app.post('/api/users/:id', users.updateUser);

    app.get('/api/cards/:uid', cards.getCardsForUser);

    app.post('/api/cards', cards.addCard);

    app.get('/api/orders/:id', orders.getOrderById);

    app.post('/api/orders', orders.addOrder);

    app.put('/api/orders', orders.updateOrder);
    //app.post('/api/users', users.createUser);

    app.get('/api/send_sms_verify_code', users.sendVerifyCode);
};
