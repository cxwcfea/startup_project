var express = require('express'),
    app = express(),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    log4js = require('log4js'),
    logger = log4js.getLogger(),
    config = require('./config/config')[env];

require('./config/express')(app, config);

require('./config/mongoose')(config);

require('./config/passport');

require('./config/routes')(app);

// custom 404 page
app.use(function(req, res){
	res.status(404);
	res.render('page_not_found');
});

// custom 500 page
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('server_error');
});

function startServer() {
    app.listen(app.get('port'), function(){
        logger.info('Express started on ' + app.get('port') + '; press Ctrl-C to terminate.');
    });
}

if(require.main === module){
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function to create server
    module.exports = startServer;
}


