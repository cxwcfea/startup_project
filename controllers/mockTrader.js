var mongoose = require('mongoose');

// model.js
var PPJUserSchema = mongoose.Schema({
    name: { type: String, default: "" },
    warning: { type: Number, default: 0 },  // basis: cent, 0.01
    close: { type: Number, default: 0 },  // basis: cent, 0.01
    lever: { type: Number, default: 0 },  // basis: 0.0001
    debt: { type: Number, default: 0 },  // basis: cent, 0.01
    cash: { type: Number, default: 0 },  // basis: cent, 0.01
    deposit: { type: Number, default: 0 },  // basis: cent, 0.01
    status: { type: Number, default: 0 },  // 0: Normal, 1: Cannot buy, 2: Forbidden
    lastCash: { type: Number, default: 0 },  // basis: cent, 0.01, the cash of the last time when user have no position
    timestamp: { type: Date, default: Date.now }
});
var User = mongoose.model('PPJUser', PPJUserSchema);

var PPJContractSchema = mongoose.Schema({
    exchange: { type: String, default: "future" },
    stock_code: { type: String, default: getStockCode}
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
    lockedCash: { type: Number, default: 0},  // basis: cent, 0.01
    profit: { type: Number, default: 0 }
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
    total_deposit: { type: Number, default: 0},  // basis: cent, 0.01
    total_point: { type: Number, default: 0},  // basis: cent, 0.01
});
var Portfolio = mongoose.model('PPJPortfolio', PPJPortfolioSchema);

var kInitialCapital = 100000000;
var kHand = 100;
var kFeePerHand = 20000;  // 200 RMB per hand
var kFeePerTenThousand = 25;  // 0.25 RMB per 10000.00 RMB
var kMarketDepositPercentage = 1200;  // to buy 1 hand you need 12.00% deposit
var kMarketPointValue = 30000;  // 300RMB per point
// util.js
function makeTimestamp() { return Date.now();}
function makeRedisKey(contract) { return "mt://" + contract.exchange + "/" + contract.stock_code; }
function getCosts(stock_price, quantity, position, total_point, total_deposit) {
    var raw = 0;
    var fee = 0;
    var q = Math.abs(quantity);  // additional cost for adjusting positions
    var profit = 0;
    var point_released = 0;
    var deposit_released = 0;
    var net_profit = 0;
    if ((position > 0 && quantity < 0) || (position < 0 && quantity > 0)) {
        var pos_released = Math.min(Math.abs(position), Math.abs(quantity));
        var new_open = Math.abs(quantity) - pos_released;
        q = new_open;
        // released point
        point_released = (total_point / Math.abs(position)) * pos_released;
        profit = kMarketPointValue * (stock_price * pos_released / 100 - point_released) / 100.0;
        if (position < 0) {
          profit = -profit;
        }
        net_profit = profit;
        // released deposit
        deposit_released = (total_deposit / Math.abs(position)) * pos_released;
        profit += deposit_released;
    }
    var coeff = kMarketPointValue * stock_price / 10000.0 * kMarketDepositPercentage / 10000.0;
    raw = coeff * q;
    // fee = Math.abs(quantity) / kHand * kFeePerHand;
    fee = kMarketPointValue * Math.abs(quantity) * stock_price / 10000 * kFeePerTenThousand / 1000000;
    net_profit -= fee;
    var point_diff = point_released - q * stock_price / 100;
    var deposit_diff = deposit_released - raw;
    var locked_cash = raw-profit+fee;
    console.log(q, pos_released, raw, profit, fee, point_diff, deposit_diff);
    return {raw: raw, fee: fee, open: locked_cash, locked_cash: locked_cash, point:point_diff, deposit:deposit_diff, profit:profit, net_profit:net_profit};
}

function closeAll(userId, portfolio, income, contractInfo, reset, cb) {
    var asyncObj = {remaining: portfolio.length, value: 0, has_error: false, errmsg:""};
    User.findById(userId, function(err, user) {
        if (err) {
            console.log(err);
            return cb(err.toString());
        }
        if (!user) {
            console.log('user not found when closeAll');
            return cb(err.toString());
        }
        if (reset == 1) {
          // Reset user
          user.cash = user.deposit + user.debt;
        } else {
          // Close user
          user.cash += income;
        }
        user.lastCash = user.cash;
        user.save(function(err) {
            if (err) {
                console.log(err);
                return cb(err.toString());
            }
            for (var p in portfolio) {
                var portf = portfolio[p];
                console.log(contractInfo);
                var costs = getCosts(contractInfo[portf.contractId].LastPrice, -portf.quantity, portf.quantity, portf.total_point, portf.total_deposit);
                var diffLong = 0;
                var diffShort = 0;
                if (-portf.quantity > 0) diffLong = Math.abs(portf.quantity);
                if (-portf.quantity < 0) diffShort = Math.abs(portf.quantity);
                Portfolio.update({_id: portf._id},
                    {
                        $set:{quantity:0, longQuantity: 0, shortQuantity: 0, total_point:0, total_deposit:0},
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
                            price: contractInfo[portf.contractId].LastPrice,
                            fee: costs.fee,
                            lockedCash: costs.locked_cash,
                            profit: costs.net_profit
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
                            //console.log("Completed: " + asyncObj);
                            // all set
                            cb(null, order);
                        });
                });
            }
        });
    });
}

function setStatus(userId, status) {
    User.update({_id: userId}, {$set:{status: status}}, function(err, numberAffected, raw) {
        if (err) {
            console.log(err);
            return;
        }
        if (!numberAffected) {
            console.log('mockTrader.setStatus no user found');
            return;
        }
    });
}

function windControl(userId, forceClose, cb) {
    User.findOne({$and: [{_id: userId}, {status: 0}]}, function(err, user) {
        if (err) {
            console.log(err);
            //res.send({code: -1, "msg": err.errmsg});
            cb(err.toString());
            return;
        }
        if (!user) {
            console.log('no available user');
            //res.send({code: -1, "msg": err.errmsg});
            cb('no available user');
            return;
        }
        Portfolio.find({userId: userId}, function(err, portfolio) {
            if (err) {
                console.log(err);
                //res.send({code: -2, "msg": err.errmsg});
                cb(err.toString());
                return;
            }
            if (!portfolio) {
                console.log('no available portfolio');
                //res.send({code: -2, "msg": err.errmsg});
                cb('no available portfolio');
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
                            if (err) asyncObj.errmsg = err.errmsg;
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
                        priceInfo.LastPrice *= 100;

                        contractInfo[portf.contractId] = priceInfo;
                        var costs = getCosts(priceInfo.LastPrice, -portf.quantity, portf.quantity, portf.total_point, portf.total_deposit);
                        asyncObj.value -= costs.open;
                        if (asyncObj.remaining > 0) {
                            console.log("Still counting: " + asyncObj);
                            return;
                        }
                        //console.log("Completed: " + asyncObj);
                        var income = asyncObj.value;
                        console.log("User info: " + userId + ", " + user.cash + ", " + income + ", " + user.close);
                        if (!forceClose && user.cash + income > user.close) {
                            // No risk
                            console.log("No risk");
                            cb(null);
                        } else {
                            if (income > 0) {
                                // Close all positions
                                console.log("Closing user");
                                if (!forceClose)
                                  // Have to close
                                  // setStatus(userId, 1);  // cannot buy
                                  closeAll(userId, portfolio, income, contractInfo, 1, cb);
                                else
                                  // Force close
                                  closeAll(userId, portfolio, income, contractInfo, 0, cb);
                            } else {
                                console.log("Closed");
                                cb(null);
                            }
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
            console.log('user not found');
            //res.send({code: 1, "msg": err.errmsg});
            cb('user not found');
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

function getProfit(req, res) {
    User.findOne({_id: req.body.user_id}, function(err, user) {
        if (err || !user) {
            console.log(err);
            res.status(500).send({error_msg: err? err.errmsg: "no available user"});
            return;
        }
        Portfolio.find({userId: req.body.user_id}, function(err, portfolio) {
            if (err) {
                console.log(err);
                res.status(500).send({error_msg: err.errmsg});
                return;
            }
            if (!portfolio.length) {
                res.status(400).send({error_msg:'portfolio not found'});
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
                            res.status(500).send({error_msg: asyncObj.errmsg});
                        }
                        return;
                    }
                    global.redis_client.get(makeRedisKey(contract), function(err, priceInfoString) {
                        if (err || !priceInfoString) {
                            console.log(err);
                            asyncObj.has_error = true;
                            if (err) asyncObj.errmsg = err.errmsg;
                        }
                        if (asyncObj.has_error) {
                            if (asyncObj.remaining <= 0){
                                res.status(500).send({error_msg: asyncObj.errmsg});
                            }
                            return;
                        }
                        var priceInfo = JSON.parse(priceInfoString);
                        priceInfo.LastPrice *= 100;
                        console.log(priceInfo.LastPrice);

                        contractInfo[portf.contractId] = priceInfo;
                        var costs = getCosts(priceInfo.LastPrice, -portf.quantity, portf.quantity, portf.total_point, portf.total_deposit);
                        asyncObj.value -= costs.open;
                        if (asyncObj.remaining > 0) {
                            console.log("Still counting: " + asyncObj);
                            return;
                        }
                        //console.log("Completed: " + asyncObj);
                        var income = asyncObj.value;
                        console.log("User info: " + req.body.user_id + ", " + user.cash + ", " + income + ", " + user.close);
                        var lastProfit = user.lastCash ? user.lastCash - kInitialCapital : 0;
                        res.send({result: user.cash + income - user.deposit - user.debt - lastProfit, lastProfit:lastProfit, lastPrice:priceInfo.LastPrice});
                        return;
                    });
                });
            }
        });
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
    //console.log(req.body);
    windControl(req.body.user_id, req.body.force_close, function(err, order) {
        if (err) {
            return res.status(500).send({error_msg:err.toString()});
        }
        res.send(order);
    });
}

function createOrder(data, cb) {
    console.log(data);
    if (!data.order.quantity || data.order.quantity % kHand != 0) {
        console.log("invalid quantity");
        cb({code:1, msg:"invalid quantity"});
        return;
    }
    // find user
    User.findOne({_id: data.user_id}, function(err, user) {
        if (err) {
            console.log(err);
            cb(err.toString());
            return;
        }
        if (user.status != 0) {
            //res.send({code: 3, "msg": "Account status is not normal."});
            cb({code:3, msg:'Account status is not normal.'});
            return;
        }
        // find contract
        Contract.findOne({
            "stock_code": data.order.contract.stock_code,
            "exchange": data.order.contract.exchange
        }, function(err, contract) {
            if (err) {
                console.log(err);
                cb({code:2, msg:err.toString()});
                return;
            }
            if (!contract) {
                console.log('failed to create contract');
                return cb({code:2, msg:'failed to create contract'});
            }
            // find contract price info
            global.redis_client.get(makeRedisKey(contract), function(err, priceInfoString) {
                var priceInfo = JSON.parse(priceInfoString);
                priceInfo.LastPrice *= 100;
                console.log(priceInfo);
                Portfolio.findOne({$and: [{contractId: contract._id}, {userId: user._id}]}, function(err, portfolio) {
                    if (err) {
                        console.log(err);
                        cb({code:2, msg:err.toString()});
                        return;
                    }
                    if (!portfolio) {
                        portfolio = new Portfolio({contractId: contract._id, userId: user._id});
                    }
                    var costs = getCosts(priceInfo.LastPrice, data.order.quantity, portfolio.quantity, portfolio.total_point, portfolio.total_deposit);
                    if (user.cash < costs.open) {
                        //res.send({code: 4, "msg": "user.cash < costs.open", data: {costs: costs, cash: user.cash}});
                        cb({code:5, msg:'user.cash < costs.open'});
                        return;
                    }
                    var order = new Order({
                        contractId: contract._id,
                        userId: user._id,
                        quantity: data.order.quantity,
                        price: priceInfo.LastPrice,
                        fee: costs.fee,
                        lockedCash: costs.locked_cash,
                        profit: costs.net_profit
                    });
                    var oldUserCash = user.cash;
                    var oldUserLastCash = user.lastCash;
                    user.cash -= costs.open;
                    portfolio.quantity += data.order.quantity;
                    portfolio.total_point -= costs.point;
                    portfolio.total_deposit -= costs.deposit;
                    if (data.order.quantity > 0) {
                        portfolio.longQuantity += data.order.quantity;
                    } else {
                        portfolio.shortQuantity -= data.order.quantity;
                    }
                    portfolio.fee += costs.fee;
                    if (portfolio.quantity === 0) {
                        user.lastCash = user.cash;
                    }
                    // write back
                    User.update({_id: user._id, cash: oldUserCash, lastCash: oldUserLastCash},
                        {$set:{cash: user.cash, lastCash: user.lastCash}}, function(err, numberAffected, raw) {
                        if (err || numberAffected != 1) {
                            console.log(err);
                            //res.send({code: 5, "msg": err.errmsg});
                            cb({code:2, msg:err? err.toString(): "Placing order too fast"});
                            return;
                        }
                        portfolio.save(function(err) {
                            if (err) {
                                console.log(err);
                                //res.send({code: 6, "msg": err.errmsg});
                                cb({code:2, msg:err.toString()});
                                return;
                            }
                            order.save(function(err) {
                                if (err) {
                                    console.log(err);
                                    //res.send({code: 7, "msg": err.errmsg});
                                    cb({code:2, msg:err.toString()});
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
    /*
    var d = new Date();
    var month = d.getMonth()+1;
    if (month < 10) month = "0" + month;
    return "IF" + (d.getYear()-100) + month;
    */
    return "IFCURR";
}

function getLastFuturesPrice(cb) {
    global.redis_client.get('mt://future/IFCURR', function(err, priceInfoString) {
        if (err) {
            cb(err);
        }
        if (!priceInfoString) {
            cb('the value not found in redis');
        }
        var priceInfo = JSON.parse(priceInfoString);
        cb(null, {ts:priceInfo.ts, lastPrice:priceInfo.LastPrice});
    });
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
    getUserInfo: getUserInfo,
    windControl: windControl,
    getLastFuturesPrice: getLastFuturesPrice,
    getProfit: getProfit
};
