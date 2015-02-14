var users = require('../controllers/user'),
    passportConf = require('./passport');


module.exports = function(app) {
    app.use(function(req, res, next) {
        res.locals.user = req.user;
        next();
    });

    app.get('/', function (req, res) {
        res.render('home');
    });

    app.get('/signup', function (req, res) {
        res.render('register/signup');
    });

    app.post('/signup', users.postSignup);

    app.get('/login', function (req, res) {
        res.render('register/login');
    });

    app.post('/login', users.postLogin);

    app.get('/logout', users.logout);

    app.post('/logout', users.postLogout);

    app.get('/user/index', passportConf.isAuthenticated, users.getIndex);

    app.get('/user/home', passportConf.isAuthenticated, users.getHome);

    app.get('/user/profile', passportConf.isAuthenticated, users.getProfile);
};
