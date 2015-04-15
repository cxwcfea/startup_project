var https = require('https');
var http = require('http');
var querystring = require('querystring');

var message_str = "感谢您使用牛金网,您的验证码为:PLACE_HOLDER,请勿向任何人提供此短信验证码。";

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function chuanglanService(mobile_num, message, content, cb) {
    var message_content = content;
    if (!message_content) {
        message_content = message_str.replace('PLACE_HOLDER', message);
    }
    var postData = querystring.stringify({
        'account' : 'VIP_njw',
        'pswd' : 'Tch123456',
        'mobile' : mobile_num,
        'msg' : message_content,
        'needstatus' : false
    });

    var options = {
        hostname: '222.73.117.158',
        port: 80,
        path:'/msg/HttpBatchSendSM',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    var req = http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            cb({error_code:0});
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        cb({error_code:1, error_msg: e.toString()});
    });

    // write data to request body
    req.write(postData);
    req.end();
}

function luosimaoService(mobile_num, message, content, cb) {
    var message_content = content;
    if (!message_content) {
        message_content = message_str.replace('PLACE_HOLDER', message);
    }
    var postData = {
        mobile: mobile_num,
        message: message_content + ' 【牛金网】'
    };

    var content = querystring.stringify(postData);

    var options = {
        host:'sms-api.luosimao.com',
        path:'/v1/send.json',
        method:'POST',
        auth:'api:key-105a1053b9a9ce887aed1dc4c5965dd2',
        agent:false,
        rejectUnauthorized : false,
        headers:{
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' :content.length
        }
    };

    try {
        var req = https.request(options,function(res){
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                if (cb) {
                    cb(chunk);
                }
                console.log(JSON.parse(chunk));
            });
            res.on('end',function(){
                console.log('over');
            });
        });

        req.write(content);
        req.end();
    } catch (e) {
        console.log('error when send sms:' + e);
        res.status(500);
        res.send({error_msg: e.toString()});
    }
}

module.exports.generateVerifyCode = function() {
    var verify_code = "";
    for (var i = 0; i < 4; ++i) {
        verify_code += getRandomInt(0, 9);
    }
    return verify_code;
};

module.exports.sendSMS = function(mobile_num, message, content, cb) {
    //luosimaoService(mobile_num, message, content, cb);
    //chuanglanService(mobile_num, message, content, cb);
    if (Math.random() > 0.3) {
        luosimaoService(mobile_num, message, content, cb);
    } else {
        chuanglanService(mobile_num, message, content, cb);
    }
};

