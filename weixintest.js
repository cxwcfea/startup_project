var crypto = require("crypto"),
    https = require('https'),
    util = require('util');

var token = '8CAD6DE09F1AEB';

function BaseButton() {
    this.menuName = {};
}

function Button(btnName, btnUrl) {
    this.type = 'view';
    this.name = btnName;
    this.url = btnUrl;
}

util.inherits(Button, BaseButton);

function ComplexButton(btnName) {
    this.name = btnName;
    this.sub_button = new Array();
}

util.inherits(ComplexButton,BaseButton);

function isLegel(signature, timestamp, nonce, token){
    var array = new Array();
    array[0] = timestamp;
    array[1] = nonce;
    array[2] = token;
    array.sort();
    var hasher = crypto.createHash("sha1");
    var msg= array[0] + array[1] + array[2];
    hasher.update(msg);
    var msg = hasher.digest('hex');
    if (msg == signature) {
        return true;
    } else {
        return false;
    }
}

module.exports.checkSignature = function(req, res) {
    var signature= req.query.signature;
    var timestamp= req.query.timestamp;
    var nonce = req.query.nonce;
    var echostr = req.query.echostr;
    var check = false;
    check = isLegel(signature, timestamp, nonce, token);
    if (check) {
        res.send(echostr);
    } else {
        res.send("error data");
    }
};

function test() {
    var StockButton = new ComplexButton('配资炒股');
    var AppDownLoadButton = new ComplexButton('下载软件');
    var MyAccountButton = new ComplexButton('我的账户');

    var ButtonFreeTry = new Button('免费体验','http://m.niujinwang.com/free_apply');
    var ButtonDaysNiu = new Button('天天牛','http://m.niujinwang.com/mobile/#/ttn');

    StockButton.sub_button[0] = ButtonFreeTry;
    StockButton.sub_button[1] = ButtonDaysNiu;

    var ButtonIPhoneApp = new Button('iPhone版','https://itunes.apple.com/cn/app/homs-yong-jin-ban/id950510961?mt=8');
    var ButtonAndroidApp = new Button('Android版','http://www.ihoms.com/file/xunlei/downloadxunlei/HOMS_YONGJINBAN_android.apk?fileCode=38&sourceType=4');

    AppDownLoadButton.sub_button[0] = ButtonIPhoneApp;
    AppDownLoadButton.sub_button[1] = ButtonAndroidApp;

    var ButtonRegister= new Button('注册','http://www.niujinwang.com/mobile/#/signup');
    var ButtonLogin = new Button('登录','http://www.niujinwang.com/mobile/#/login');
    var ButtonUser = new Button('个人中心','http://www.niujinwang.com/mobile/#/user');

    MyAccountButton.sub_button[0] = ButtonRegister;
    MyAccountButton.sub_button[1] = ButtonLogin;
    MyAccountButton.sub_button[2] = ButtonUser;

    var obj = {
        button: [
            StockButton,
            AppDownLoadButton,
            MyAccountButton
        ]
    };
    return JSON.stringify(obj);
}
console.log(test());

module.exports.getManagerMenu = function(req, res) {
    var StockButton = new ComplexButton('配资炒股');
    var AppDownLoadButton = new ComplexButton('下载软件');
    var MyAccountButton = new ComplexButton('我的账户');

    var ButtonFreeTry = new Button('免费体验','http://m.niujinwang.com/free_apply');
    var ButtonDaysNiu = new Button('天天牛','http://m.niujinwang.com/mobile/#/ttn');

    StockButton.sub_button[0] = ButtonFreeTry;
    StockButton.sub_button[1] = ButtonDaysNiu;

    var ButtonIPhoneApp = new Button('iPhone版','https://itunes.apple.com/cn/app/homs-yong-jin-ban/id950510961?mt=8');
    var ButtonAndroidApp = new Button('Android版','http://www.ihoms.com/file/xunlei/downloadxunlei/HOMS_YONGJINBAN_android.apk?fileCode=38&sourceType=4');

    AppDownLoadButton.sub_button[0] = ButtonIPhoneApp;
    AppDownLoadButton.sub_button[1] = ButtonAndroidApp;

    var ButtonRegister= new Button('注册','http://www.niujinwang.com/mobile/#/signup');
    var ButtonLogin = new Button('登录','http://www.niujinwang.com/mobile/#/login');
    var ButtonUser = new Button('个人中心','http://www.niujinwang.com/mobile/#/user');

    MyAccountButton.sub_button[0] = ButtonRegister;
    MyAccountButton.sub_button[1] = ButtonLogin;
    MyAccountButton.sub_button[2] = ButtonUser;

    var obj = {
        button: [
            StockButton,
            AppDownLoadButton,
            MyAccountButton
        ]
    };
    return Json.stringify(obj);
};

module.exports.getToken = function() {
    https.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx182b3688b9b060f7&secret=13ea8e4782476ccdf2d58bbbb1634513', function(res) {
        console.log(res);
        global.weixin_token = {
            token: res.access_token,
            expires: Date.now() + 7200000 // 2 hour
        }
    });
};

module.exports.sendMenue = function() {
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
};

