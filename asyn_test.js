var async = require('async');

async.waterfall([
	function(callback) {
		callback(null, 'err1', 'err2', 'err3');
	}
], function(err, result, result2, result3) {
	if (err) {
		console.log(err.toString());
	}
	console.log(result);
	console.log(result2);
	console.log(result3);
});
