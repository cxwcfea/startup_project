var passport = require('passport'),
    User = require('../models/User'),
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

var client = {
    pub :ursa.createPublicKey(client_public)
};

var padding             = ursa.RSA_PKCS1_PADDING;
/*
var clientPublic        = client.pub;
var clientModulusBit    = 128;
var clientMaxBit        = clientModulusBit/8;
var clientRealBit       = clientMaxBit - 11;

function bytes(text, coding) {
    if (typeof text === 'undefined') {
        throw new Error("must have a arg.");
    }

    coding = coding || 'utf8';
    return Buffer.byteLength(text.toString(), coding);
}

function RSAEncrypt(plain, publicKey, realBit, padding){
    var start1 = 0;
    var end1   = realBit;
    var result1 = '';
    var originBuff = new Buffer(plain);
    var originByte = bytes(plain, 'utf8');
    while(start1 < originByte){
        var originTmp  = originBuff.slice(start1, end1);
        result1 += publicKey.encrypt(originTmp, 'binary', 'binary', padding);
        start1 += realBit;
        end1 += realBit;
    }

    var encrypted =  encoding.convert(result1, 'binary', 'base64');

    return encrypted.toString();
}
*/

function RSAEncrypt(data, publicKey) {
    return publicKey.encrypt(data, 'utf8', 'base64', padding);
}

function AESEncrypt(data, key) {
    console.log(key);
    var algorithm = 'aes-128-ecb';
    var clearEncoding = 'utf8';
    var iv = "";
    var cipherEncoding = 'base64';
    var cipher = crypto.createCipheriv(algorithm, key, iv);

    var cipherChunks = [];
    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    console.log(cipherEncoding + ' ciphertext: ' + cipherChunks.join(''));
    return cipherChunks.join('');
}

var bindCard = function(req, res) {

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
    var data = {
        merchantaccount: '10000419568',
        identityid: req.user._id,
        requestid: util.generateSerialID(),
        cardno: req.body.card_no,
        idcardtype: '01',
        idcardno: req.body.cert_no,
        username: req.body.real_name,
        phone: req.body.card_bind_mobile_phone_no,
        userip: req.body.user_ip
    };
    logger.debug(data);
    var keys = _.keys(data);
    keys = _.sortBy(keys);
    var str = '';
    for (var i = 0; i < keys.length-1; ++i) {
        str += data[keys[i]];
    }
    str += data[keys[i]];
    logger.debug(str);

    var priv = ursa.createPrivateKey(new Buffer(client_private));
    var content = new Buffer(str);
    var sign = priv.hashAndSign('sha1', content, 'utf8', 'base64');

    data['sign'] = sign;
    logger.debug(data);
    var aesKey = util.generateRandomKey(16);
    console.log('aesKey: ' + aesKey);
    var postData = AESEncrypt(JSON.stringify(data), aesKey);
    console.log('postData: ' + postData);
    var encryptKey = client.pub.encrypt(aesKey, 'utf8', 'base64', padding);
    console.log('encryptKey: ' + encryptKey);
    var finalData = 'data=' + encodeURIComponent(postData) + '&encryptkey=' + encodeURIComponent(encryptKey) + '&merchantaccount=10000419568';
    /*
    var accountBuffer = new Buffer('10000419568');
    var dataBuffer = new Buffer(postData);
    var keyBuffer = new Buffer(encryptKey);
    var finalData = Buffer.concat([accountBuffer, dataBuffer, keyBuffer]);
    */

    //var url = 'https://ok.yeepay.com/payapi/api/tzt/invokebindbankcard?' + finalData;
    //console.log('\n');
    //logger.debug(url);
    var url = 'https://ok.yeepay.com/payapi/api/tzt/invokebindbankcard';
    needle.post(url, finalData, {}, function(err, resp, body) {
        if (err) {
            logger.error(err.toString());
        }
        logger.info(body.toString());
    });
    /*
    request({
        url: url,
        method: "POST",
        headers: {
        },
        body: finalData
    }, function (error, response, body){
        if (error) {
            logger.error(err.toString());
        } else {
            logger.info(body.toString());
        }
    });
    */
    /*
    var options = {
        json: true,
        follow_max: 3 // follow up to three redirects
    };
    */
    res.send({});
};

module.exports = {
    registerRoutes: function (app, passportConf) {
        app.post('/api/yeepay_bind_card', passportConf.isAuthenticated, bindCard);
    }
};
