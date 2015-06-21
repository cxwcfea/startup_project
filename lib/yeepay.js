var User = require('../models/User'),
    Order = require('../models/Order'),
    Apply = require('../models/Apply'),
    PayInfo = require('../models/PayInfo'),
    crypto = require('crypto'),
    sms = require('../lib/sms'),
    needle = require('needle'),
    ursa = require('ursa'),
    log4js = require('log4js'),
    logger = log4js.getLogger('yeepay'),
    util = require('../lib/util'),
    env = process.env.NODE_ENV;
    config = require('../config/config')[env],
    _ = require('lodash'),
    sparkMD5 = require('spark-md5'),
    moment = require('moment'),
    request = require('request'),
    async = require('async');

var client_public  =    '-----BEGIN PUBLIC KEY-----\n'+
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCj4k0oTc05UzrvBB6g24wsKawT\n'+
    'lIX5995q3CQYrgM5un9mKEQc/NQIsJqqG2RUHyXUIBogMaMqG1F1QPoKMaXeVfVU\n'+
    'SYa8ZU7bV9rOMDUT20BxAmPbtLlWdTSXDxXKXQxwkyfUAih1ZgTLI3vYg3flHeUA\n'+
    '6cZRdbwDPLqXle8SIwIDAQAB\n'+
    '-----END PUBLIC KEY-----';
var client_private = '-----BEGIN RSA PRIVATE KEY-----\n'+
    'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAIrFrIoH9OoNe1wp\n'+
    'o5s48/NUvev76CEQ/jmdqL1yMbQlC32bQXn4XxFXKCLPFLzeIFMd3lslusw8sOHc\n'+
    'a+MabVtsmHM7ibZsXZ9Cba4nQLdyR2b0Bkrx+rNydym7Z3LXMXK5wXIeEoiBmvKp\n'+
    '9bk9Lcb1SiFLjr3yoDmPh1x5Z/k/AgMBAAECgYEAgAjVohypOPDraiL40hP/7/e1\n'+
    'qu6mQyvcgugVcYTUmvK64U7HYHNpsyQI4eTRq1f91vHt34a2DA3K3Phzifst/Roo\n'+
    'nlMmugXg/Klr5nOXNBZhVO6i5XQ3945dUeEq7LhiJTTv0cokiCmezgdmrW8n1STZ\n'+
    '/b5y5MIOut8Y1rwOkAECQQC+an4ako+nPNw72kM6osRT/qC589AyOav60F1bHonK\n'+
    '6NWzWOMiFekGuvtpybgwt4jbpQxXXRPxvJkgBq873fwBAkEAupGaEcuqXtO2j0hJ\n'+
    'FOG5t+nwwnOaJF49LypboN0RX5v8nop301//P16Bs/irj5F/mAs9lFR4GZ3bxL8z\n'+
    's5r1PwJBALa1MDMHFlf+CcRUddW5gHCoDkjfLZJDzEVp0WoxLz5Hk2X3kFmQdHxE\n'+
    'xiCHsfjs4qD/CYx6fzyhHrygLVxgcAECQAT8z3maUDuovUCnVgzQ2/4mquEH5h8C\n'+
    'xe/02e46+rPrn509ZmaoMlKnXCBLjYqRATA3XLYSbAODTNS9p8wtYFECQHa/xgB+\n'+
    'nYWoevPC/geObOLAP9HMdNVcIAJq2rgeXVI4P7cFXvksRborHmjuy1fltoR0003q\n'+
    'lSg82mxzABbzYUs=\n'+
    '-----END RSA PRIVATE KEY-----';

var client = {
    pub: ursa.createPublicKey(client_public),
    pem: ursa.createPrivateKey(client_private)
};

var merchantaccount     = '10000419568';
var padding             = ursa.RSA_PKCS1_PADDING;
var aesAlgorithm        = 'aes-128-ecb';
var clearEncoding       = 'utf8';
var cipherEncoding      = 'base64';
var aesIV               = '';
var aesKeyLengh         = 16;

function AESEncrypt(data, key) {
    var cipher = crypto.createCipheriv(aesAlgorithm, key, aesIV);

    var cipherChunks = [];
    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    console.log(cipherEncoding + ' ciphertext: ' + cipherChunks.join(''));
    return cipherChunks.join('');
}

function AESDecrypt(data, key) {
    var decipher = crypto.createDecipheriv(aesAlgorithm, key, aesIV);

    var plainChunks = [];
    plainChunks.push(decipher.update(data, cipherEncoding, clearEncoding));
    plainChunks.push(decipher.final(clearEncoding));
    console.log("UTF8 plaintext deciphered: " + plainChunks.join(''));
    return plainChunks.join('');
}

function generateRequestData(data) {
    var keys = _.keys(data);
    keys = _.sortBy(keys);
    var str = '';
    for (var i = 0; i < keys.length-1; ++i) {
        str += data[keys[i]];
    }
    str += data[keys[i]];

    var content = new Buffer(str);
    var sign = client.pem.hashAndSign('sha1', content, clearEncoding, cipherEncoding);

    data['sign'] = sign;
    var aesKey = util.generateRandomKey(aesKeyLengh);
    var encryptData = AESEncrypt(JSON.stringify(data), aesKey);
    var encryptKey = client.pub.encrypt(aesKey, 'utf8', 'base64', padding);
    return 'data=' + encodeURIComponent(encryptData) + '&encryptkey=' + encodeURIComponent(encryptKey) + '&merchantaccount=' + merchantaccount;
}

function parseResponse(response) {
    var aesKey = client.pem.decrypt(response.encryptkey, cipherEncoding, clearEncoding, padding);
    return AESDecrypt(response.data, aesKey);
}

var bindCard = function(req, res) {
    var dataObj = {
        merchantaccount: merchantaccount,
        identityid: req.user._id,
        identitytype: 2,
        requestid: util.generateSerialID(),
        cardno: req.body.card_no,
        idcardtype: '01',
        idcardno: req.body.cert_no,
        username: req.body.real_name,
        phone: req.body.card_bind_mobile_phone_no,
        userip: req.body.user_ip
    };
    logger.debug(dataObj);

    var data = generateRequestData(dataObj);
    var url = 'https://ok.yeepay.com/payapi/api/tzt/invokebindbankcard';
    needle.post(url, data, {}, function(err, resp, body) {
        if (err) {
            logger.error(err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        var result = parseResponse(JSON.parse(body));
        result = JSON.parse(result);
        logger.debug(result);
        if (result.error_code) {
            res.status(403);
            return res.send({error_msg:result.error_msg});
        }
        res.send({requestID:dataObj.requestid});
    });
};

var confirmBindCard = function(req, res) {
    var verifyCode = req.body.verifyCode;
    if (!verifyCode) {
        res.status(403);
        return res.send({error_msg:'验证码无效'});
    }
    var dataObj = {
        merchantaccount: merchantaccount,
        requestid: req.body.requestID,
        validatecode: verifyCode
    };
    logger.debug(dataObj);
    var data = generateRequestData(dataObj);
    var url = 'https://ok.yeepay.com/payapi/api/tzt/confirmbindbankcard';
    needle.post(url, data, {}, function(err, resp, body) {
        if (err) {
            logger.error(err.toString());
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        var result = parseResponse(JSON.parse(body));
        result = JSON.parse(result);
        logger.debug(result);
        if (result.error_code) {
            res.status(403);
            return res.send({error_msg:result.error_msg});
        }
        var payInfoData = {
            userID: req.user._id,
            mobile: req.user.mobile,
            certNo: 'N/A',
            bankCode: result.bankcode,
            cardID: result.card_top + '****' + result.card_last,
            userName: 'N/A',
            cardLast: result.card_last,
            cardTop: result.card_top,
            infoType: 2
        };
        PayInfo.create(payInfoData, function (err, payInfo) {
            if (!payInfo) {
                logger.warn('confirmBindCard create payinfo fail for user:' + req.user.mobile);
                res.status(500);
                return res.send({error_msg:err.toString()});
            }
            res.send({});
        });
    });
};

function confirmPayRequest(orderID, verifyCode, res) {
    var dataObj = {
        merchantaccount: merchantaccount,
        orderid: orderID
    };
    if (verifyCode) {
        dataObj.validatecode = verifyCode;
    }
    var data = generateRequestData(dataObj);
    var url = 'https://ok.yeepay.com/payapi/api/tzt/pay/confirm/validatecode';
    needle.post(url, data, {}, function(err, resp, body) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        var data = JSON.parse(body.toString());
        if (data.error_code) {
            res.status(403);
            return res.send({error_msg:data.error_msg});
        }
        var result = parseResponse(data);
        result = JSON.parse(result);
        logger.debug(result);
        if (result.error_code) {
            res.status(403);
            return res.send({error_msg:result.error_msg});
        }
        res.send({});
    });
}

var payRequest = function(req, res) {
    var order_id = req.body.out_trade_no;
    async.waterfall([
        function(callback) {
            if (order_id) {
                Order.findById(req.body.out_trade_no, function(err, order) {
                    if (!order) {
                        err = 'order not found';
                    }
                    if (err) {
                        callback(err);
                    } else {
                        order.description += ' 易宝快捷充值';
                        order.amount = Number(Number(req.body.amount).toFixed(2));
                        order.payType = 9;
                        order.save(function(err) {
                            callback(err, order);
                        });
                    }
                });
            } else {
                var newOrder = {};
                newOrder.userID = req.user._id;
                newOrder.userMobile = req.user.mobile;
                newOrder.dealType = 1;
                newOrder.amount = Number(Number(req.body.amount).toFixed(2));
                newOrder.description = '易宝快捷充值';
                newOrder.payType = 9;
                newOrder.status = 2;
                Order.create(newOrder, function(err, order) {
                    order_id = order._id;
                    callback(err, order);
                });
            }
        },
        function(order, callback) {
            var dataObj = {
                merchantaccount: merchantaccount,
                orderid: order_id,
                transtime: Math.round(Date.now() / 1000),
                amount: Math.round(order.amount * 100),
                productname: '股票配资',
                identityid: req.user._id,
                identitytype: 2,
                card_top: req.body.cardTop,
                card_last: req.body.cardLast,
                callbackurl: config.pay_callback_domain + '/api/yeepay_feedback',
                userip: req.body.user_ip
            };
            logger.debug(dataObj);
            var data = generateRequestData(dataObj);
            var url = 'https://ok.yeepay.com/payapi/api/tzt/directbindpay';
            needle.post(url, data, {}, function(err, resp, body) {
                callback(err, body.toString());
            });
        }
    ], function(err, body) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        var data = JSON.parse(body);
        if (data.error_code) {
            res.status(403);
            return res.send({error_msg:data.error_msg});
        }
        var result = parseResponse(data);
        result = JSON.parse(result);
        logger.debug(result);
        if (result.error_code) {
            res.status(403);
            return res.send({error_msg:result.error_msg});
        }
        res.send({});
        /*
        if (result.smsconfirm === 0) {
            confirmPayRequest(order_id, null, res);
        } else {
            res.send({needSMSCode:true});
        }
        */
    });
};

var yeepayFeedback = function(req, res) {
    //console.log('yeepayFeedback ' + req.body.toString());
    console.log('yeepayFeedback req:' + req);
    console.log('yeepayFeedback req body:' + req.body);
    console.log('yeepayFeedback req query:' + req.query);
    for (var key in req.body) {
        if (req.body.hasOwnProperty(key)) {
            console.log('yeepayFeedback ' + key + " -> " + req.body[key]);
        }
    }
    var postData = "";
    req.setEncoding("utf8");
    req.addListener("data", function(postDataChunk) {
        postData += postDataChunk;
    });
    req.addListener("end", function() {
        console.log('yeepayFeedback after parse ' + postData);
    });
    res.send('success');
    /*
    async.waterfall([
        function (callback) {

        }
        function(amount, callback) {
            User.findById(req.user._id, function(err, user) {
                if (!err && !user) {
                    err = 'user not found';
                }
                callback(err, user, amount);
            });
        },
        function(user, amount, callback) {
            Order.findById(req.body.out_trade_no, function(err, order) {
                if (!err && !order) {
                    err = 'order not found';
                }
                callback(err, user, order, amount);
            });
        },
        function(user, order, amount, callback) {
            if (amount <= 0) {
                callback('pay amount not valid:' + amount);
                return;
            }
            order.payType = 5;
            util.orderFinished(user, order, 1, function(err) {
                callback(err, user, order);
            });
        },
        function(user, order, callback) {
            logger.info('beifuPay update user & order successfully');
            if (order.applySerialID) {
                logger.info('beifuPay pay apply');
                Apply.findOne({serialID:order.applySerialID}, function(err, apply) {
                    if (!err && !apply) {
                        err = 'can not found apply when pay apply:' + order.applySerialID;
                    }
                    callback(err, user, apply, order);
                });
            } else {
                callback(null, user, null, null);
            }
        },
        function(user, apply, order, callback) {
            if (apply) {
                if (apply.status === 1) {
                    util.applyConfirmed(user, apply, function(err) {
                        callback(err);
                    });
                } else if (apply.status === 2) {
                    logger.info('beifuPay apply add deposit');
                    util.applyDepositAdded(user, apply, order.amount, function(err) {
                        callback(err);
                    });
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        },
    ], function (err) {

    });
*/
};

module.exports = {
    registerRoutes: function (app, passportConf) {
        app.post('/api/yeepay_bind_card', passportConf.isAuthenticated, bindCard);
        app.post('/api/yeepay_confirm_bind_card', passportConf.isAuthenticated, confirmBindCard);
        app.post('/api/yeepay_request', passportConf.isAuthenticated, payRequest);
        app.post('/api/yeepay_feedback', yeepayFeedback);
    },
    getBankName: function(bank_code) {
        var bankList = {
            ICBC: '工商银行',
            BOC: '中国银行',
            CCB: '建设银行',
            POST: '邮政储蓄银行',
            ECITIC: '中信银行',
            CEB: '光大银行',
            HXB: '华夏银行',
            CMBCHINA:'招商银行',
            CIB: '兴业银行',
            SPDB: '浦发银行',
            PINGAN: '平安银行',
            GDB: '广发银行',
            CMBC: '民生银行',
            ABC: '农业银行',
            BOCO: '交通银行'
        };
        return bankList[bank_code];
    }
};
