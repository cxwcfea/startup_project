var mongoose = require('mongoose');
var Redlock = require('redlock');
var PPJResetRecord = require('../models/PPJResetRecord');

console.log(global.redis_client);
var redlock = new Redlock(
    // you should have one client for each redis node
    // in your cluster
    [require("redis").createClient()],
    {
      // the expected clock drift; for more details
      // see http://redis.io/topics/distlock
      driftFactor: 0.01,

      // the max number of times Redlock will attempt
      // to lock a resource before erroring
      retryCount:  10,

      // the time in ms between attempts
      retryDelay:  200
    }
);

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
    real: { type: Boolean, default: false },
    winPoint: { type: Number, default: 0 },
    lossPoint: { type: Number, default: 0 },
    tradeControl: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});
var User = mongoose.model('PPJUser', PPJUserSchema);

var PPJContractSchema = mongoose.Schema({
    exchange: { type: String, default: "future" },
    stock_code: { type: String, default: getStockCode},
    hand: { type: Number, default: 100 },  // basis: 0.01
    fee_type: { type: String, default: "value" },  // hand/value
    fee_per_hand: { type: Number, default: 15000 },  // basis: cent, 0.01
    fee_per_ten_thousand: { type: Number, default: 25 },  // basis: cent, 0.01
    deposit_percentage: { type: Number, default: 1200 },  // basis: 0.01
    point_value: { type: Number, default: 30000 },  // basis: cent, 0.01
    cash: { type: String, default: "CNY" }  // CNY/USD
});
PPJContractSchema.index({exchange: 1, stock_code: -1}, {unique: true});
var Contract = mongoose.model('PPJContract', PPJContractSchema);

var PPJOrderSchema = mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    contractId: { type: String },
    userId: { type: String },
    entrustId: { type: Number },
    cash: {type: Number, default: 0},
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
    total_point: { type: Number, default: 0}  // basis: cent, 0.01
});
var Portfolio = mongoose.model('PPJPortfolio', PPJPortfolioSchema);

var kInitialCapital = 20000000;
var kHand = 100;
// var kFeePerHand = 15000;  // 150 RMB per hand
// var kFeePerTenThousand = 25;  // 0.25 RMB per 10000.00 RMB
// var kMarketDepositPercentage = 1200;  // to buy 1 hand you need 12.00% deposit
// var kMarketPointValue = 30000;  // 300RMB per point
var kUSDCNY = 620;  // 6.20 exchange rate
// util.js
function makeTimestamp() { return Date.now();}
function makeRedisKey(contract) { return "mt://" + contract.exchange + "/" + contract.stock_code; }
function getCosts(contract, stock_price, quantity, position, total_point, total_deposit) {
    var raw = 0;
    var fee = 0;
    var q = Math.abs(quantity);  // additional cost for adjusting positions
    var profit = 0;
    var point_released = 0;
    var deposit_released = 0;
    var net_profit = 0;
    var ex_rate = 100;
    if (contract.cash === 'USD') ex_rate = kUSDCNY;
    if ((position > 0 && quantity < 0) || (position < 0 && quantity > 0)) {
        var pos_released = Math.min(Math.abs(position), Math.abs(quantity));
        var new_open = Math.abs(quantity) - pos_released;
        q = new_open;
        // released point
        point_released = (total_point / Math.abs(position)) * pos_released;
        profit = contract.point_value * ex_rate / 100.0 * (stock_price * pos_released / 100 - point_released) / 100.0;
        if (position < 0) {
          profit = -profit;
        }
        net_profit = profit;
        // released deposit
        deposit_released = (total_deposit / Math.abs(position)) * pos_released;
        profit += deposit_released;
    }
    var coeff = contract.point_value * ex_rate / 100.0 * stock_price / 10000.0 * contract.deposit_percentage / 10000.0;
    raw = coeff * q;
    if (contract.fee_type === 'hand') {
      fee = Math.abs(quantity) / contract.hand * contract.fee_per_hand * ex_rate / 100.0;
    } else {
      fee = contract.point_value * ex_rate / 100.0 * Math.abs(quantity) * stock_price / 10000 * contract.fee_per_ten_thousand / 1000000;
    }
    net_profit -= fee;
    var point_diff = point_released - q * stock_price / 100;
    var deposit_diff = deposit_released - raw;
    var locked_cash = raw-profit+fee;
    //console.log(q, pos_released, raw, profit, fee, point_diff, deposit_diff);
    return {raw: raw, fee: fee, open: locked_cash, locked_cash: locked_cash, point:point_diff, deposit:deposit_diff, profit:profit, net_profit:net_profit};
}

function closeAll(userId, portfolio, income, contractInfo, contractData, reset, cb, lock) {
    var asyncObj = {remaining: portfolio.length, value: 0, has_error: false, errmsg:""};
      User.findById(userId, function(err, user) {
          if (err) {
              console.log(err);
              cb(err.toString());
              return lock.unlock();
          }
          if (!user) {
              console.log('user not found when closeAll');
              cb(err.toString());
              return lock.unlock();
          }
          var oldUserCash = user.cash;
          var oldUserLastCash = user.lastCash;
          if (reset == 1) {
            // Reset user
            user.cash = user.deposit + user.debt;
          } else {
            // Close user
            user.cash += income;
          }
          user.lastCash = user.cash;
          User.update({_id: user._id, cash: oldUserCash, lastCash: oldUserLastCash},
              {$set:{cash: user.cash, lastCash: user.lastCash}}, function(err, numberAffected, raw) {
              if (err || numberAffected != 1) {
                   console.log(err);
                  //res.send({code: 5, "msg": err.errmsg});
                  cb({code:2, msg:err? err.toString(): "Placing order too fast"});
                  return lock.unlock();
              }
              for (var p in portfolio) {
                  var portf = portfolio[p];
                  console.log(contractInfo);
                  var costs = getCosts(contractData[portf.contractId], contractInfo[portf.contractId].LastPrice, -portf.quantity, portf.quantity, portf.total_point, portf.total_deposit);
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
                                  lock.unlock();
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
                                      lock.unlock();
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
                              return lock.unlock();
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

function windControl(userId, forceClose, userContract, cb) {
    var resource = 'mt://lock/user/' + userId;
    var ttl = 10000;
    redlock.lock(resource, ttl).then(function(lock) {
      User.findOne({$and: [{_id: userId}, {status: 0}]}, function(err, user) {
          if (err) {
              console.log(err);
              cb(err.toString());
              return lock.unlock();
          }
          if (!user) {
              console.log('no available user');
              cb('no available user');
              return lock.unlock();
          }
          Portfolio.find({userId: userId}, function(err, portfolio) {
              if (err) {
                  console.log(err);
                  cb(err.toString());
                  return lock.unlock();
              }
              if (!portfolio) {
                  console.log('no available portfolio');
                  cb('no available portfolio');
                  return lock.unlock();
              }
              var asyncObj = {remaining: portfolio.length, value: 0, has_error: false, errmsg:"", callbackInvoke:false};
              var contractInfo = {};
              var contractData = {};

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
                          if (asyncObj.remaining <= 0 && !asyncObj.callbackInvoke){
                              asyncObj.callbackInvoke = true;
                              cb(asyncObj.errmsg);
                              lock.unlock();
                          }
                          return;
                      }
                      if (!(contract.exchange === userContract.exchange &&
                          contract.stock_code === userContract.stock_code)) {
                          if (asyncObj.remaining <= 0 && !asyncObj.callbackInvoke){
                              asyncObj.callbackInvoke = true;
                              cb("No stock matching request");
                              lock.unlock();
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
                              if (asyncObj.remaining <= 0 && !asyncObj.callbackInvoke){
                                  asyncObj.callbackInvoke = true;
                                  cb(asyncObj.errmsg);
                                  lock.unlock();
                              }
                              return;
                          }
                          var priceInfo = JSON.parse(priceInfoString);
                          priceInfo.LastPrice *= 100;

                          contractInfo[portf.contractId] = priceInfo;
                          contractData[portf.contractId] = contract;
                          var costs = getCosts(contract, priceInfo.LastPrice, -portf.quantity, portf.quantity, portf.total_point, portf.total_deposit);
                          asyncObj.value -= costs.open;
                          //console.log("Completed: " + asyncObj);
                          var income = asyncObj.value;
                          //console.log("User info: " + userId + ", " + user.cash + ", " + income + ", " + user.close);
                          if (!forceClose && user.cash + income > user.close) {
                              // No risk
                              console.log("No risk");
                              cb(null);
                              return lock.unlock();
                          } else {
                              if (income > 0) {
                                  // Close all positions
                                  console.log("Closing user");
                                  if (!forceClose) {
                                    // Have to close
                                    // setStatus(userId, 1);  // cannot buy
                                    closeAll(userId, portfolio, income, contractInfo, contractData, 1, cb, lock);
                                  } else {
                                    // Force close
                                    if (typeof userContract !== 'undefined') {
                                        portfolio = [portf];
                                    }
                                    closeAll(userId, portfolio, income, contractInfo, contractData, 0, cb, lock);
                                  }
                              } else {
                                  console.log("Closed");
                                  cb(null);
                                  return lock.unlock();
                              }
                          }
                      });
                  });
              }
          });
      });
    }, function(){
      console.log("fail to lock resource: " + resource);
      cb("fail to lock resource: " + resource);
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
    ]}).sort({timestamp: -1}).skip(req.body.page.from).limit(req.body.page.perpage);
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
            res.send({user:user, orders:collection, pageCount:req.body.page.count});
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

function getProfitImpl(req, res, user, contractId) {
    var query = {userId: req.body.user_id};
    if (contractId !== null) {
      query = {userId: req.body.user_id, contractId: contractId};
    }
    Portfolio.find(query, function(err, portfolio) {
        if (err) {
            console.log(err);
            res.status(500).send({error_msg: err.errmsg});
            return;
        }
        if (!portfolio.length) {
            console.log('portfolio not found');
            getLastFuturesPrice(function(err, data) {
                if (err) {
                    return res.status(400).send({error_msg:err.toString()});
                }
                res.send({result: 0, lastProfit:0, lastPrice:data.lastPrice, yesterdayClose:data.yesterdayClose, portfolio:null});
            });
            return;
        }
        var asyncObj = {remaining: portfolio.length, value: 0, has_error: false, errmsg:""};
        var contractInfo = {};

        for (var p in portfolio) {
            var portf = portfolio[p];
            Contract.findOne({_id: portf.contractId}, function(err, contract) {
                asyncObj.remaining -= 1;
                if (err || !contract) {
                    //console.log(err);
                    //console.log(contract);
                    //console.log(portf);
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
                    //console.log(priceInfo.LastPrice);

                    contractInfo[portf.contractId] = priceInfo;
                    var costs = getCosts(contract, priceInfo.LastPrice, -portf.quantity, portf.quantity, portf.total_point, portf.total_deposit);
                    asyncObj.value -= costs.open;
                    if (asyncObj.remaining > 0) {
                        console.log("Still counting: " + asyncObj);
                        return;
                    }
                    //console.log("Completed: " + asyncObj);
                    var income = asyncObj.value;
                    //console.log("User info: " + req.body.user_id + ", " + user.cash + ", " + income + ", " + user.close);
                    var lastProfit = user.lastCash ? user.lastCash - (user.deposit + user.debt) : 0;
                    res.send({result: user.cash + income - user.deposit - user.debt - lastProfit, lastProfit:lastProfit, lastPrice:priceInfo.LastPrice, yesterdayClose:priceInfo.PreSettlementPrice, portfolio:portf});
                    return;
                });
            });
        }
    });
}
function getProfit(req, res) {
    User.findOne({_id: req.body.user_id}, function(err, user) {
        if (err || !user) {
            console.log(err);
            res.status(500).send({error_msg: err? err.errmsg: "no available user"});
            return;
        }
        if (typeof req.body.contract !== 'undefined') {
            Contract.findOne({exchange: req.body.contract.exchange,
                              stock_code: req.body.contract.stock_code}, function(err, contract) {
                if (err || !contract) {
                    console.log(err);
                    res.status(500).send({error_msg: err? err.errmsg: "no available contract"});
                    return;
                }
                getProfitImpl(req, res, user, contract._id);
            });
        } else {
            getProfitImpl(req, res, user, null);
        }
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

function resetUser(userID, cb) {
    User.findById(userID, function(err, user) {
        if (err) {
            return cb(err);
        }
        if (!user) {
            return cb('can not find the user');
        }
        Portfolio.findOne({userId:userID}, function(err, portfolio) {
            if (err) {
                return cb(err);
            }
            if (!portfolio) {
                return cb('portfolio not found');
            }
            var record = new PPJResetRecord({
                userData: {
                    cash: user.cash,
                    status: user.status,
                    lastCash: user.lastCash
                },
                positions: {
                    contractId: portfolio.contractId,
                    quantity: portfolio.quantity,
                    longQuantity: portfolio.longQuantity,
                    shortQuantity: portfolio.shortQuantity,
                    fee: portfolio.fee,
                    total_deposit: portfolio.total_deposit,
                    total_point: portfolio.total_point
                },
                userId: userID
            });
            record.save(function(err) {
                if (err) {
                    return cb(err);
                }
                User.update({_id:userID}, {$set:{close:17500000, warning:18000000, cash:20000000, deposit:3000000, debt:17000000, lastCash:0, status:0}}, function(err, numberAffected, raw) {
                    if (err) {
                        return cb(err);
                    }
                    Portfolio.update({userId:userID}, {$set:{total_point:0, total_deposit:0, fee:0, shortQuantity:0, longQuantity:0, quantity:0}}, function(err, numberAffected, raw) {
                        if (err) {
                            return cb(err);
                        }
                        cb(null);
                    });
                });
            })
        });
    });
}

function riskControl(req, res) {
    //console.log(req.body);
    windControl(req.body.user_id, req.body.force_close, req.body.contract, function(err, order) {
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
    var resource = 'mt://lock/user/' + data.user_id;
    var ttl = 10000;
    // find user
    redlock.lock(resource, ttl).then(function(lock) {
      User.findOne({_id: data.user_id}, function(err, user) {
          if (err) {
              console.log(err);
              cb(err.toString());
              return lock.unlock();
          }
          if (!user) {
              console.log('user not found when create Order');
              cb({code:2, msg:'user not found when create Order'});
              return lock.unlock();
          }
          if (user.status != 0) {
              cb({code:3, msg:'Account status is not normal.'});
              return lock.unlock();
          }
          // find contract
          Contract.findOne({
              "stock_code": data.order.contract.stock_code,
              "exchange": data.order.contract.exchange
          }, function(err, contract) {
              if (err) {
                  console.log(err);
                  cb({code:2, msg:err.toString()});
                  return lock.unlock();
              }
              if (!contract) {
                  console.log('failed to create contract');
                  cb({code:2, msg:'failed to create contract'});
                  return lock.unlock();
              }
              // find contract price info
              global.redis_client.get(makeRedisKey(contract), function(err, priceInfoString) {
                  var priceInfo = JSON.parse(priceInfoString);
                  priceInfo.LastPrice *= 100;
                  Portfolio.findOne({$and: [{contractId: contract._id}, {userId: user._id}]}, function(err, portfolio) {
                      if (err) {
                          console.log(err);
                          cb({code:2, msg:err.toString()});
                          return lock.unlock();
                      }
                      if (!portfolio) {
                          portfolio = new Portfolio({contractId: contract._id, userId: user._id});
                      }

                      if ((data.order.quantity < 0 && portfolio.quantity < 0) || (data.order.quantity > 0 && portfolio.quantity > 0)) {
                          cb({code:7, msg:'can not buy more than 1 hand for the same type'});
                          return lock.unlock();
                      }

                      var costs = getCosts(contract, priceInfo.LastPrice, data.order.quantity, portfolio.quantity, portfolio.total_point, portfolio.total_deposit);
                      if (user.cash < costs.open) {
                          cb({code:5, msg:'user.cash < costs.open'});
                          return lock.unlock();
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
                              cb({code:2, msg:err? err.toString(): "Can not update user"});
                              return lock.unlock();
                          }
                          portfolio.save(function(err) {
                              if (err) {
                                  console.log(err);
                                  cb({code:2, msg:err.toString()});
                                  return lock.unlock();
                              }
                              order.save(function(err) {
                                  if (err) {
                                      console.log(err);
                                      cb({code:2, msg:err.toString()});
                                      return lock.unlock();
                                  }
                                  cb(null, order);
                                  return lock.unlock();
                              });
                          });
                      });
                  });
              });
          });
      });
    }, function(){
        console.log("fail to lock resource: " + resource);
        cb({code:4, msg:"fail to lock resource: " + resource});
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
        priceInfo.LastPrice *= 100;
        cb(null, {ts:priceInfo.ts, lastPrice:priceInfo.LastPrice, yesterdayClose:priceInfo.PreSettlementPrice});
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
    getProfit: getProfit,
    resetUser: resetUser
};
