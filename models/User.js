var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    mobile: { type: Number, unique: true, required:'{PATH} is required!' },
    password: { type: String, required:'{PATH} is required!' },
    roles: [String],
	level: { type: Number, default: 0 },
	score: { type: Number, default: 0 },
	
	finance: {
		balance: { type: Number, default: 0 },
		deposit: { type: Number, default: 0 },
		total_capital: { type: Number, default: 0 },
		available_capital: { type: Number, default: 0 },
		market_value: { type: Number, default: 0 }	
	},

    profile: {
		identity: String,
        email: { type: String, lowercase: true },
        name: { type: String, default: '' },
        gender: { type: String, default: '' },
        location: { type: String, default: '' },
        picture: { type: String, default: '' }
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date
});

/**
 * Password hash middleware.
 */
userSchema.pre('save', function(next) {
	var user = this;
	if (!user.isModified('password')) return next();
	bcrypt.genSalt(5, function(err, salt) {
		if (err) return next(err);
		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if (err) return next(err);
			user.password = hash;
			next();
		});
	});
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err) return cb(err);
		cb(null, isMatch);
	});
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function(size) {
	if (!size) size = 200;
	if (!this.profile.email) return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
	var md5 = crypto.createHash('md5').update(this.profile.email).digest('hex');
	return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
};

module.exports = mongoose.model('User', userSchema);

