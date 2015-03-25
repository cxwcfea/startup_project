var https = require('https');
var querystring = require('querystring');

var message_str = "感谢您使用牛金网,您的验证码为:PLACE_HOLDER,请勿向任何人提供此短信验证码。";

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports.generateVerifyCode = function() {
    var verify_code = "";
    for (var i = 0; i < 4; ++i) {
        verify_code += getRandomInt(0, 9);
    }
    return verify_code;
};

module.exports.sendSMS = function(mobile_num, message, content, cb) {
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
};

