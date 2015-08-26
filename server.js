var express = require('express'),
    app = express(),
    http = require('http'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    log4js = require('log4js'),
    logger = log4js.getLogger(),
    task = require('./lib/task'),
    ctpTrader = require('./controllers/ctpTrader'),
    cluster = require('cluster'),
    config = require('./config/config')[env];

/*
// use domains for better error handling
app.use(function(req, res, next){
    // create a domain for this request
    var domain = require('domain').create();
    // handle errors on this domain
    domain.on('error', function(err){
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // failsafe shutdown in 5 seconds
            setTimeout(function(){
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);

            // disconnect from the cluster
            var worker = require('cluster').worker;
            if(worker) worker.disconnect();

            // stop taking new requests
            server.close();

            try {
                // attempt to use Express error route
                next(err);
            } catch(error){
                // if Express error route failed, try
                // plain Node response
                console.error('Express error mechanism failed.\n', error.stack);
                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain');
                res.end('Server error.');
            }
        } catch(error){
            console.error('Unable to send 500 response.\n', error.stack);
        }
    });

    // add the request and response objects to the domain
    domain.add(req);
    domain.add(res);

    // execute the rest of the request chain in the domain
    domain.run(next);
});
*/

require('./config/redis')();

require('./config/express')(app, config);

require('./config/mongoose')(config);

require('./config/passport');

require('./config/routes')(app);

// custom 404 page
app.use(function(req, res){
    res.locals.other_menu = true;
    res.locals.not_found = true;
	res.status(404);
	res.render('404');
});

// custom 500 page
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('server_error');
});

function startServer() {
    var server = http.createServer(app);
    server.listen(app.get('port'), function() {
        logger.info('Express started on ' + app.get('port') + '; press Ctrl-C to terminate.');
        if (cluster.isMaster) {
            logger.info('Master start');
            var io = require('socket.io')(server);
            require('./config/socket.io')(io);
            ctpTrader.initHive(1);
            task.scheduleFuturesRiskControlJob();
            task.scheduleFuturesForceCloseJob();
            task.schedulePPJUserDailyJob();
            task.scheduleTriggeredJob();
        }
    });
}

if(require.main === module){
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function to create server
    module.exports = startServer;
}


