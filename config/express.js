var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    compress = require('compression'),
    bodyParser = require('body-parser'),
    connectAssets = require('connect-assets'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    expressValidator = require('express-validator'),
    flash = require('express-flash'),
    exphbs = require('express-handlebars');

module.exports = function(app, config) {
	app.set('port', config.port);
	var handlebars = exphbs.create({ 
		layoutsDir: config.rootPath + '/views/layouts/',
		defaultLayout: 'main',
        helpers: {
            static: function(name) {
                return require('../lib/static.js').map(name);
            }
        }
	});
	app.engine('handlebars', handlebars.engine);
	app.set('views', config.rootPath + '/views');
	app.set('view engine', 'handlebars');
    app.use(compress());
    app.use(connectAssets({
        paths: [path.join(config.rootPath, '/public/css')]
    }));
    app.use(logger('dev'));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(expressValidator());
    app.use(session({
        secret: 'the secret key',
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.use(express.static(config.rootPath + '/public'));
}
