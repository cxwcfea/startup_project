var bcrypt = require('bcrypt-nodejs'),
    crypto = require('crypto'),
    mongoose = require('mongoose'),
    Order = require('./Order');

var userSchema = new mongoose.Schema({
    mobile: { type: Number, unique: true, required:'{PATH} is required!' },
    password: { type: String, required:'{PATH} is required!' },
    roles: [String], // admin, support
	level: { type: Number, default: 0 },
	score: { type: Number, default: 0 },
    registerAt: {type:Date, default: Date.now},
    lastLoginAt: {type:Date, default: Date.parse('1990-01-01 00:00:00')},
    freeApply: String,  // apply serialID
    registered: {type:Boolean, default: false},
    lastPayBank: Number,

	finance: {
        password: String,
        balance: { type: Number, default: 0 },           //余额
        deposit: { type: Number, default: 0 },           //当前支付的保证金
        total_capital: { type: Number, default: 0 },     //当前总配资资产
        available_capital: { type: Number, default: 0 },
        market_value: { type: Number, default: 0 },
        freeze_capital: { type: Number, default: 0 },    //当前冻结资金
        profit: { type:Number, default: 0 },             //总收益
        history_capital: { type: Number, default: 0 },   // 累计配资资产
        history_deposit: { type: Number, default: 0 },   // 累计支付保证金
        prepaid_service_fee: { type: Number, default: 0 },  // 预付管理费
        commission: Number,
        history_commission: Number
	},

    invest: {
        profitRate: Number,
        duration: Number,                                     // 只投资于周期不大于此值的项目
        availableAmount: { type: Number, default: 0 },        // 可投资的余额
        occupiedAmount: { type: Number, default: 0 },         // 投资中的金额
        history_invest_amount: { type: Number, default: 0 },  // 累计投资金额
        history_invest_profit: { type: Number, default: 0 },  // 累计投资收益
        total_invest_days: { type: Number, default: 0 },      // 总投资天数（已结束投资)
        enable: Boolean
    },

    profile: {
        email_verified: {type: Boolean, default: false},
        email: {type: String, lowercase: true},
        name: String,
        gender: {type: String, default: 'M'},
        location: String,
        qq: Number,
        weibo: String,
        picture: {type: String, default: ''},
        alipay_account: String,
        alipay_name: String,
        weixin_id: String,
        wechat_uuid: String
    },

    identity: {
        id: String,
        name: String,
        idType: {type: Number, default: 1}
    },

    referName: String,
    refer: String,
    manager: String,
    verifyEmailToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

/**
 * Password hash middleware.
 */
userSchema.pre('save', function(next) {
	var user = this;
	if (!user.isModified('password') && !user.isModified('finance.password')) return next();
	bcrypt.genSalt(5, function(err, salt) {
		if (err) return next(err);
        if (user.isModified('password')) {
            bcrypt.hash(user.password, salt, null, function(err, hash) {
                if (err) return next(err);
                user.password = hash;
                next();
            });
        } else {
            bcrypt.hash(user.finance.password, salt, null, function(err, hash) {
                if (err) return next(err);
                user.finance.password = hash;
                next();
            });
        }
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

userSchema.methods.compareFinancePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.finance.password, function(err, isMatch) {
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

userSchema.methods.getOrders = function(cb){
    return Order.find({ userID: this._id }, cb);
};

module.exports = mongoose.model('User', userSchema);

