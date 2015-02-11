var express = require('express'),
    app = express(),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env];

require('./config/express')(app, config);

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/signup', function(req, res) {
    res.render('user/signup');
});

// custom 404 page
app.use(function(req, res){
	res.type('text/plain');
	res.status(404);
	res.send('404 - Not Found');
});

// custom 500 page
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.type('text/plain');
	res.status(500);
	res.send('500 - Server Error');
});

app.listen(app.get('port'), function(){
	console.log( 'Express started on ' + app.get('port') + '; press Ctrl-C to terminate.' );
});

