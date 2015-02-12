var users = require('../controllers/user');

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.locals.user = req.user;
        next();
    });

    app.get('/', function (req, res) {
        res.render('home');
    });

    app.get('/signup', function (req, res) {
        res.render('user/signup');
    });

    app.post('/signup', users.postSignup);

    app.get('/login', function (req, res) {
        res.render('user/login');
    });

    app.post('/login', users.postLogin);

    app.get('/logout', users.logout);

    app.get('/profile', users.getProfile);
}
