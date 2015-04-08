var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    compress = require('compression'),
    bodyParser = require('body-parser'),
    //connectAssets = require('connect-assets'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    expressValidator = require('express-validator'),
    flash = require('express-flash'),
    credentials = require('../credentials.js'),
    mongoSessionStore = require('session-mongoose')(require('connect')),
    exphbs = require('express-handlebars'),
    log4js = require('log4js');

module.exports = function(app, config) {
	app.set('port', config.port);
	var handlebars = exphbs.create({ 
		layoutsDir: config.rootPath + '/views/layouts/',
		defaultLayout: 'main',
        helpers: {
            static: function (name) {
                return require('../lib/static.js').map(name);
            },
            ifCond: function (v1, operator, v2, options) {
                switch (operator) {
                    case "==":
                        return (v1 == v2) ? options.fn(this) : options.inverse(this);

                    case "!=":
                        return (v1 != v2) ? options.fn(this) : options.inverse(this);

                    case "===":
                        return (v1 === v2) ? options.fn(this) : options.inverse(this);

                    case "!==":
                        return (v1 !== v2) ? options.fn(this) : options.inverse(this);

                    case "&&":
                        return (v1 && v2) ? options.fn(this) : options.inverse(this);

                    case "||":
                        return (v1 || v2) ? options.fn(this) : options.inverse(this);

                    case "<":
                        return (v1 < v2) ? options.fn(this) : options.inverse(this);

                    case "<=":
                        return (v1 <= v2) ? options.fn(this) : options.inverse(this);

                    case ">":
                        return (v1 > v2) ? options.fn(this) : options.inverse(this);

                    case ">=":
                        return (v1 >= v2) ? options.fn(this) : options.inverse(this);

                    default:
                        return eval("" + v1 + operator + v2) ? options.fn(this) : options.inverse(this);
                }
            }
        }
    });
	app.engine('handlebars', handlebars.engine);
	app.set('views', config.rootPath + '/views');
	app.set('view engine', 'handlebars');
    app.use(compress());
    /*
    app.use(connectAssets({
        paths: [path.join(config.rootPath, '/public/css')]
    }));
    */

    switch(app.get('env')){
        case 'development':
            // compact, colorful dev logging
            app.use(logger('dev'));
            break;
        case 'production':
            app.use(logger('tiny'));
            // module 'express-logger' supports daily log rotation
            //app.use(require('express-logger')({ path: config.rootPath + '/log/requests.log'}));
            log4js.configure({
                appenders: [
                    { type: 'console' },
                    {
                        type: 'file',
                        filename: 'log/server.log',
                        "maxLogSize": 20480
                    }
                ]
            });
            break;
    }

    var sessionStore = new mongoSessionStore({ url: config.db, autoReconnect: true });

    app.enable('trust proxy');
    app.use(cookieParser(credentials.cookieSecret));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(expressValidator());
    app.use(session({
        cookie: {
            maxAge: 2 * 60 * 60 * 1000
        },
        store: sessionStore,
        secret: 'the secret key',
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.use(express.static(config.rootPath + '/public'));
};
