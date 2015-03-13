var async = require('async');

async.waterfall([
	function(callback) {
		callback('err1');
		return;
		console.log('afer err1');
	}
], function(err, result) {
	if (err) {
		console.log(err.toString());
	}
	console.log(result);
});
