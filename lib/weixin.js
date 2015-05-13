var crypto = require("crypto"),
    needle = require('needle'),
    xml2js = require('xml2js'),
    util = require('util');

var token = '8CAD6DE09F1AEB';

function BaseButton() {
    this.menuName = {};
}

function ButtonUrl(btnName, btnUrl) {
    this.type = 'view';
    this.name = btnName;
    this.url = btnUrl;
}

util.inherits(ButtonUrl, BaseButton);

function ButtonClick(btnName, eventName) {
    this.type = 'click';
    this.name = btnName;
    this.key = eventName;
}

util.inherits(ButtonClick, BaseButton);

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
    console.log('checkSignature ' + Date.now());
    var signature= req.query.signature;
    var timestamp= req.query.timestamp;
    var nonce = req.query.nonce;
    var echostr = req.query.echostr;
    var check = false;
    check = isLegel(signature, timestamp, nonce, token);
    if (check) {
        console.log('weixin check pass');
        res.send(echostr);
    } else {
        console.log('checkSignature error data');
        res.send("error data");
    }
    sendMenu();
};

module.exports.handlePostMessage = function(req, res) {
    if (req.user) {
        console.log('handlePostMessage ' + req.user.mobile);
    }
    var postData = "";
    req.setEncoding("utf8");
    req.addListener("data", function(postDataChunk) {
        postData += postDataChunk;
    });
    req.addListener("end", function() {
        console.log('handlePostMessage data ' + postData);
        xml2js.parseString(postData, function(err, result) {
            if (err) {
                console.log('handlePostMessage ' + err.toString());
            } else {
                if (result.xml && result.xml.FromUserName && result.xml.Event) {
                    if (result.xml.FromUserName[0] && result.xml.Event[0] == 'VIEW') {
                        var openID = result.xml.FromUserName[0];
                        console.log('user openID ' + openID);
                    }
                }
            }
        });
    });
    sendMenu();
    res.send({});
};

function getManagerMenu() {
    var StockButton = new ComplexButton('配资炒股');
    var AppDownLoadButton = new ComplexButton('下载软件');
    var MyAccountButton = new ComplexButton('我的账户');

    var ButtonFreeTry = new ButtonUrl('免费体验','http://m.niujinwang.com/free_apply');
    var ButtonDaysNiu = new ButtonUrl('天天牛','http://m.niujinwang.com/mobile/#/ttn');

    StockButton.sub_button[0] = ButtonFreeTry;
    StockButton.sub_button[1] = ButtonDaysNiu;

    var ButtonIPhoneApp = new ButtonUrl('iPhone版','http://www.baidu.com');
    var ButtonAndroidApp = new ButtonUrl('Android版','http://www.ihoms.com/file/xunlei/downloadxunlei/HOMS_YONGJINBAN_android.apk?fileCode=38&sourceType=4');

    AppDownLoadButton.sub_button[0] = ButtonIPhoneApp;
    AppDownLoadButton.sub_button[1] = ButtonAndroidApp;

    var ButtonRegister= new ButtonUrl('注册','http://test2.niujinwang.com/mobile/#/signup');
    var ButtonLogin = new ButtonUrl('登录','http://test2.niujinwang.com/mobile/#/login');
    var ButtonUser = new ButtonUrl('个人中心','http://test2.niujinwang.com/mobile/#/user');

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
};

function getToken(cb) {
    //if (!global.weixin_token || global.weixin_token.expires < Date.now()) {
        console.log('weixin getToken');
        needle.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx182b3688b9b060f7&secret=13ea8e4782476ccdf2d58bbbb1634513', function(err, resp, body) {
            if (err) {
                console.log('get Weixin token err:' + err.toString());
                cb(err);
            } else {
                global.weixin_token = {
                    token: body.access_token,
                    expires: Date.now() + 7000000 // 2 hour
                };
                cb(null, global.weixin_token.token);
            }
        });
    //} else {
    //    console.log('weixin use old token');
    //    cb(null, global.weixin_token.token);
    //}
};

function sendMenu() {
    getToken(function(err, token) {
        if (err) {
            return;
        }
        var postData = getManagerMenu();
        console.log('Weixin token:' + token);
        console.log('Weixin data:' + postData);
        var options = {
            json: true,
            follow_max: 3 // follow up to three redirects
        };
        needle.post('https://api.weixin.qq.com/cgi-bin/menu/create?access_token=' + token, postData, options, function(err, resp, body) {
            if (err) {
                console.log(err);
            }
            console.log(body);
        });
    });
};

