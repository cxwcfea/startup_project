var mongoose = require('mongoose');

// model.js
var PPJUserSchema = mongoose.Schema({
    name: { type: String, default: "" },
    warning: { type: Number, default: 0 },  // basis: cent, 0.01
    close: { type: Number, default: 0 },  // basis: cent, 0.01
    lever: { type: Number, default: 0 },  // basis: 0.0001
    debt: { type: Number, default: 0 },  // basis: cent, 0.01
    cash: { type: Number, default: 0 },  // basis: cent, 0.01
    status: { type: Number, default: 0 },  // 0: Normal, 1: Cannot buy, 2: Forbidden
    timestamp: { type: Date, default: Date.now }
});
var User = mongoose.model('PPJUser', PPJUserSchema);

var PPJContractSchema = mongoose.Schema({
    exchange: { type: String, default: "future" },
    stock_code: { type: String, default: function() {
        var d = new Date();
        var month = d.getMonth()+1;
        if (month < 10) month = "0" + month;
        return "IF" + (d.getYear()-100) + month;
    }}
});
PPJContractSchema.index({exchange: 1, stock_code: -1}, {unique: true});
var Contract = mongoose.model('PPJContract', PPJContractSchema);

var PPJOrderSchema = mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    contractId: { type: String },
    userId: { type: String },
    // status: { type: Number, default: 0},  // 0: open
    quantity: { type: Number, default: 0},  // basis: 0.01, positive means buy, negative means sell
    // filledQuantity: { type: Number, default: 0},  // basis: 0.01
    // orderType: { type: Number, default: 0},  // 0: market order
    // orderPrice: { type: Number, default: 0},  // basis: 0.01
    // filledAmount: { type: Number, default: 0},  // basis: cent, 0.01
    price: { type: Number, default: 0},  // basis: cent, 0.01
    fee: { type: Number, default: 0},  // basis: cent, 0.01
    lockedCash: { type: Number, default: 0}  // basis: cent, 0.01
});
var Order = mongoose.model('PPJOrder', PPJOrderSchema);

var PPJPortfolioSchema = mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    contractId: { type: String },
    userId: { type: String },
    // status: { type: Number, default: 0},  // 0: open
    quantity: { type: Number, default: 0},  // basis: 0.01, positive means buy, negative means sell
    longQuantity: { type: Number, default: 0},  // basis: 0.01
    shortQuantity: { type: Number, default: 0},  // basis: 0.01
    fee: { type: Number, default: 0},  // basis: cent, 0.01
});
var Portfolio = mongoose.model('PPJPortfolio', PPJPortfolioSchema);

var kHand = 10000;
var kFeePerHand = 20000;  // 200 RMB per hand
// util.js
function makeTimestamp() { return Date.now();}
function makeRedisKey(contract) { return "mt://" + contract.exchange + "/" + contract.stock_code; }
function getCosts(stock_price, quantity, position) {
    var raw = 0;
    var fee = 0;
    var q = Math.abs(quantity);  // additional cost for adjusting positions
    var diff = Math.abs(position) - Math.abs(position + quantity);
    if (diff > 0) {
        q = diff;
    }
    raw = stock_price * q / 100;
    fee = quantity / kHand * kFeePerHand;
    return {raw: raw, fee: fee, open: raw+fee, close: raw-fee};
}

function closeAll(userId, portfolio, income, contractInfo, cb) {
    var asyncObj = {remaining: portfolio.length, value: 0, has_error: false, errmsg:""};
    User.update({_id: userId}, {$inc:{cash: income}}, function(err, numberAffected, raw) {
        if (err || !numberAffected) {
            console.log(err);
            //res.send({code: -6, "msg": err.errmsg});
            cb(err.toString());
            return;
        }
        for (var p in portfolio) {
            var portf = portfolio[p];
            console.log(contractInfo);
            var costs = getCosts(contractInfo[portf.contractId].last, -portf.quantity, portf.quantity);
            var diffLong = 0;
            var diffShort = 0;
            if (-portf.quantity > 0) diffLong = Math.abs(portf.quantity);
            if (-portf.quantity < 0) diffShort = Math.abs(portf.quantity);
            Portfolio.update({_id: portf._id},
                {
                    $set:{quantity:0, longQuantity: 0, shortQuantity: 0},
                    $inc:{fee: costs.fee}
                },
                function(err, numberAffected, raw) {
                    asyncObj.remaining -= 1;
                    if (err || !numberAffected) {
                        console.log(err);
                        asyncObj.has_error = true;
                        asyncObj.errmsg = err.errmsg;
                    }
                    if (asyncObj.has_error) {
                        if (asyncObj.remaining <= 0){
                            //res.send({code: -6, "msg": asyncObj.errmsg});
                            cb(asyncObj.errmsg);
                        }
                        return;
                    }
                    // create order
                    var order = new Order({
                        contractId: portf.contractId,
                        userId: userId,
                        quantity: -portf.quantity,
                        price: contractInfo[portf.contractId].last,
                        fee: costs.fee,
                        lockedCash: costs.open
                    });
                    order.save(function(err) {
                        if (err) {
                            console.log(err);
                            asyncObj.has_error = true;
                        }
                        if (asyncObj.has_error) {
                            if (asyncObj.remaining <= 0){
                                //res.send({code: -7, "msg": asyncObj.errmsg});
                                cb(asyncObj.errmsg);
                            }
                            return;
                        }
                        if (asyncObj.remaining > 0) {
                            console.log("Still counting: " + asyncObj);
                            return;
                        }
                        console.log("Completed: " + asyncObj);
                        // all set
                        cb(null);
                    });
                });
        }
    });
}

function windControl(userId, forceClose, cb) {
    User.findOne({_id: userId}, function(err, user) {
        if (err || !user) {
            console.log(err);
            //res.send({code: -1, "msg": err.errmsg});
            cb(err.toString());
            return;
        }
        Portfolio.find({userId: userId}, function(err, portfolio) {
            if (err || !portfolio) {
                console.log(err);
                //res.send({code: -2, "msg": err.errmsg});
                cb(err.toString());
                return;
            }
            var asyncObj = {remaining: portfolio.length, value: 0, has_error: false, errmsg:""};
            var contractInfo = {};

            for (var p in portfolio) {
                var portf = portfolio[p];
                Contract.findOne({_id: portf.contractId}, function(err, contract) {
                    asyncObj.remaining -= 1;
                    if (err || !contract) {
                        console.log(err);
                        console.log(contract);
                        console.log(portf);
                        asyncObj.has_error = true;
                        if (err) asyncObj.errmsg = err.errmsg;
                    }
                    if (asyncObj.has_error) {
                        if (asyncObj.remaining <= 0){
                            //res.send({code: -3, "msg": asyncObj.errmsg});
                            cb(asyncObj.errmsg);
                        }
                        return;
                    }
                    global.redis_client.get(makeRedisKey(contract), function(err, priceInfoString) {
                        if (err || !priceInfoString) {
                            console.log(err);
                            asyncObj.has_error = true;
                        }
                        if (asyncObj.has_error) {
                            if (asyncObj.remaining <= 0){
                                //res.send({code: -4, "msg": asyncObj.errmsg});
                                cb(asyncObj.errmsg);
                            }
                            return;
                        }
                        var priceInfo = JSON.parse(priceInfoString);
                        console.log(priceInfo);

                        contractInfo[portf.contractId] = priceInfo;
                        var costs = getCosts(priceInfo.last, -portf.quantity, portf.quantity);
                        asyncObj.value += costs.close;
                        if (asyncObj.remaining > 0) {
                            console.log("Still counting: " + asyncObj);
                            return;
                        }
                        console.log("Completed: " + asyncObj);
                        var income = asyncObj.value;
                        if (!forceClose && user.cash + income > user.close) {
                            // No risk
                            console.log("No risk " + userId + ", " + user.cash + ", " + income + ", " + user.close);
                            cb(null);
                        } else {
                            // Close all positions
                            console.log("Closing user " + userId);
                            closeAll(userId, portfolio, income, contractInfo, cb);
                        }
                    });
                });
            }
        });
    });
}

function getUserInfo(data, cb) {
    console.log(data);
    // find user
    User.findOne({_id: data.user_id}, function(err, user) {
        if (err) {
            console.log(err);
            //res.send({code: 1, "msg": err.errmsg});
            cb(err.errmsg);
            return;
        }
        if (!user) {
            console.log(err);
            //res.send({code: 1, "msg": err.errmsg});
            cb(err.errmsg);
            return;
        }
        //res.send({code: 0, result:user});
        cb(null, user);
    });
}

function getHistoryOrders(req, res) {
    console.log(req.body);
    // find user
    var findings = Order.find({$and: [
        {userId: req.body.user_id},
        {timestamp: {$gte: req.body.date_begin + 8*3600*1000}},
        {timestamp: {$lt: req.body.date_end + 8*3600*1000}}
    ]}).sort({timestamp: -1}).limit(req.body.limit);
    findings.exec(function(err, collection) {
        if (err) {
            console.log(err);
            res.status(500).send({error_msg: err.errmsg});
            return;
        }
        if (!collection) {
            console.log('order not found');
            res.status(400).send({error_msg: 'order not found'});
            return;
        }
        getUserInfo({user_id:req.body.user_id}, function(err, user) {
            if (err) {
                console.log(err);
                res.status(500).send({error_msg: err.errmsg});
                return;
            }
            res.send({user:user, orders:collection});
        });
    });
}

function getPositions(data, cb) {
    console.log(data);
    // find user
    var findings = Portfolio.find({userId: data.user_id});
    findings.exec(function(err, collection) {
        if (err) {
            console.log(err);
            cb(err.toString());
            return;
        }
        if (!collection) {
            console.log('position not found');
            return cb('position not found');
        }
        cb(null, collection);
    });
}

function createUser(data, cb) {
    console.log(data);
    var user = new User(data);
    user.save(function(err) {
        if (err) {
            console.log(err);
            cb(err.toString());
            return;
        }
        cb(null, user);
    });
}

function riskControl(req, res) {
    console.log(req.body);
    windControl(req.body.user_id, req.body.force_close, function(err) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        res.send({});
    });
}

function createOrder(data, cb) {
    console.log(data);
    if (!data.order.quantity || data.order.quantity % kHand != 0) {
        console.log("invalid quantity");
        cb("invalid quantity");
        return;
    }
    // find user
    User.findOne({_id: data.user_id}, function(err, user) {
        if (err) {
            console.log(err);
            cb(err.toString());
            return;
        }
        // find contract
        Contract.findOne({
            "stock_code": data.order.contract.stock_code,
            "exchange": data.order.contract.exchange
        }, function(err, contract) {
            if (err) {
                console.log(err);
                cb(err.toString());
                return;
            }
            if (!contract) {
                console.log('failed to create contract');
                return cb('failed to create contract');
            }
            // find contract price info
            global.redis_client.get(makeRedisKey(contract), function(err, priceInfoString) {
                var priceInfo = JSON.parse(priceInfoString);
                console.log(priceInfo);
                Portfolio.findOne({$and: [{contractId: contract._id}, {userId: user._id}]}, function(err, portfolio) {
                    if (err) {
                        console.log(err);
                        cb(err.toString());
                        return;
                    }
                    if (!portfolio) {
                        portfolio = new Portfolio({contractId: contract._id, userId: user._id});
                    }
                    var costs = getCosts(priceInfo.last, data.order.quantity, portfolio.quantity);
                    if (user.cash < costs.open) {
                        //res.send({code: 4, "msg": "user.cash < costs.open", data: {costs: costs, cash: user.cash}});
                        cb('user.cash < costs.open');
                        return;
                    }
                    var order = new Order({
                        contractId: contract._id,
                        userId: user._id,
                        quantity: data.order.quantity,
                        price: priceInfo.last,
                        fee: costs.fee,
                        lockedCash: costs.open
                    });
                    user.cash -= costs.open;
                    portfolio.quantity += data.order.quantity;
                    if (data.order.quantity > 0) {
                        portfolio.longQuantity += data.order.quantity;
                    } else {
                        portfolio.shortQuantity -= data.order.quantity;
                    }
                    portfolio.fee += costs.fee;
                    // write back
                    order.save(function(err) {
                        if (err) {
                            console.log(err);
                            //res.send({code: 5, "msg": err.errmsg});
                            cb(err.toString());
                            return;
                        }
                        user.save(function(err) {
                            if (err) {
                                console.log(err);
                                //res.send({code: 6, "msg": err.errmsg});
                                cb(err.toString());
                                return;
                            }
                            portfolio.save(function(err) {
                                if (err) {
                                    console.log(err);
                                    //res.send({code: 7, "msg": err.errmsg});
                                    cb(err.toString());
                                    return;
                                }
                                //res.send({code: 0, result: order._id});
                                cb(null, order);
                            });
                        });
                    });
                });
            });
        });
    });
}

function getStockCode() {
    var d = new Date();
    var month = d.getMonth()+1;
    if (month < 10) month = "0" + month;
    return "IF" + (d.getYear()-100) + month;
}

module.exports = {
    User: User,
    Contract: Contract,
    Order: Order,
    Portfolio: Portfolio,
    createUser: createUser,
    createOrder: createOrder,
    getStockCode: getStockCode,
    riskControl: riskControl,
    getPositions: getPositions,
    getHistoryOrders: getHistoryOrders,
    getUserInfo: getUserInfo
};

