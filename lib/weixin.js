var crypto = require("crypto"),
    User = require('../models/User'),
    needle = require('needle'),
    xml2js = require('xml2js'),
    xml = require('xml'),
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

function ModuleElement(Value,Color) {
    this.value = Value;
    this.color = Color;
}

function BaseModule(ToUser,TemplateID,Data) {
    this.touser = ToUser;
    this.template_id = TemplateID;
    this.url = 'http://test2.niujinwang.com/mobile/#/user';
    this.topcolor = '#FF0000';
    this.data = Data;
}

function SuccessRecharge(First,AccountName,Amount,Result,Remark) {
    this.first = First;
    this.accountType = AccountName;
    this.amount = Amount;
    this.result = Result;
    this.remark = Remark;
}

function sendRechargeSuccessMsg(req, res) {
    var fstElement = new ModuleElement('充值成功','#173177');
    var accountElement = new ModuleElement('13439695920','#173177');
    var amountElement = new ModuleElement('100元','#173177');
    var resultElement = new ModuleElement('充值成功','#173177');
    var remarkElement = new ModuleElement('如有疑问，请联系客服4006921388','#173177');

    var data = new SuccessRecharge(fstElement,accountElement,amountElement,resultElement,remarkElement);

    var sendData = new BaseModule('oYCwTtyWh_jRdMyEMOwqvyrAsfo8','dO_7xn28VvMKJRDmiReTY-8xR122RW2WodDurAF5zcs', data);

    console.log(sendData);
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
    res.send({});
}

module.exports.sendTemplateMsg = function(req, res) {
    var num = req.query.t;
    switch (num) {
        case 1:
            sendRechargeSuccessMsg(req, res);
            break;
        default :
            sendRechargeSuccessMsg(req, res);
            break;
    }
};

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

function handleRandomText(res, inData) {
    console.log('user subscribe');
    var xmlObj = {
        xml: [
            {
                ToUserName: {_cdata: inData.FromUserName[0]}
            },
            {
                FromUserName: {_cdata: inData.ToUserName[0]}
            },
            {
                CreateTime: Date.now()
            },
            {
                MsgType: {_cdata: 'text'}
            },
            {
                Content: {_cdata: '欢迎关注牛金网！回复:#1#手机号 绑定您的微信号到牛金网账号'}
            }
        ]
    };
    var ret = xml(xmlObj);
    res.send(ret);
}

function handleSubscribe(res, inData) {
    console.log('user subscribe');
    var xmlObj = {
        xml: [
            {
                ToUserName: {_cdata: inData.FromUserName[0]}
            },
            {
                FromUserName: {_cdata: inData.ToUserName[0]}
            },
            {
                CreateTime: Date.now()
            },
            {
                MsgType: {_cdata: 'text'}
            },
            {
                Content: {_cdata: '欢迎关注牛金网！牛金网始终致力于为您提供行业内最优质的配资服务，您的专属股票配资利器/微笑'}
            }
        ]
    };
    var ret = xml(xmlObj);
    res.send(ret);
}

function handleBindRequest(res, inData) {
    console.log('user want bind');
    var xmlObj = {
        xml: [
            {
                ToUserName: {_cdata: inData.FromUserName[0]}
            },
            {
                FromUserName: {_cdata: inData.ToUserName[0]}
            },
            {
                CreateTime: Date.now()
            },
            {
                MsgType: {_cdata: 'text'}
            },
            {
                Content: {_cdata: '输入您的手机号，完成绑定'}
            }
        ]
    };
    var ret = xml(xmlObj);
    res.send(ret);
}

function sendTextMsg(res, inData, content) {
    var xmlObj = {
        xml: [
            {
                ToUserName: {_cdata: inData.FromUserName[0]}
            },
            {
                FromUserName: {_cdata: inData.ToUserName[0]}
            },
            {
                CreateTime: Date.now()
            },
            {
                MsgType: {_cdata: 'text'}
            },
            {
                Content: {_cdata: content}
            }
        ]
    };
    var ret = xml(xmlObj);
    res.send(ret);
}

function bindUser(res, inData) {
    var mobile = inData.Content[0];
    User.update({mobile:mobile}, {$set:{'profile.weixin_id':inData.FromUserName[0]}}, function(err, numberAffected, raw) {
        if (err || !numberAffected) {
            sendTextMsg(res, inData, '您还不是牛金网的会员，请先注册!');
        } else {
            sendTextMsg(res, inData, '已成功绑定您的牛金网账号!');
        }
    });
}

function handleTextMsg(res, inData) {
    console.log('user want bind');
    var re = /^1[3|5|7|8|][0-9]{9}$/;
    var result = re.test(inData.Content[0]);
    if (result) {
        bindUser(res, inData);
    } else {
        //sendTextMsg(res, inData, '您好，有什么可以帮到您?');
        handleRandomText(res, inData);
    }
}

module.exports.handlePostMessage = function(req, res) {
    if (req.user) {
        console.log('handlePostMessage ' + req.user._id);
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
                res.send({});
            } else {
                if (result.xml && result.xml.FromUserName && result.xml.Event) {
                    if (result.xml.Event[0] == 'subscribe') {
                        handleSubscribe(res, result.xml);
                    } else if (result.xml.Event[0] == 'CLICK' && result.xml.EventKey[0] == 'binding') {
                        handleBindRequest(res, result.xml);
                    } else if (result.xml.FromUserName[0] && result.xml.Event[0] == 'VIEW') {
                        var openID = result.xml.FromUserName[0];
                        console.log('user openID ' + openID);
                        res.send({});
                    }
                } else if (result.xml && result.xml.MsgType) {
                    if (result.xml.MsgType == 'text') {
                        handleTextMsg(res, result.xml);
                    } else {
                        res.send({});
                    }
                }
            }
        });
    });
    sendMenu();
};

function getManagerMenu() {
    var StockButton = new ComplexButton('配资炒股');
    var AppDownLoadButton = new ComplexButton('下载软件');
    var MyAccountButton = new ComplexButton('我的账户');

    var ButtonFreeTry = new ButtonUrl('免费体验','http://test2.niujinwang.com/free_apply');
    var ButtonDaysNiu = new ButtonUrl('天天牛','http://test2.niujinwang.com/mobile/#/ttn');

    StockButton.sub_button[0] = ButtonFreeTry;
    StockButton.sub_button[1] = ButtonDaysNiu;

    var ButtonIPhoneApp = new ButtonUrl('iPhone版','https://itunes.apple.com/cn/app/homs-yong-jin-ban/id950510961?mt=8');
    var ButtonAndroidApp = new ButtonUrl('Android版','http://www.ihoms.com/file/xunlei/downloadxunlei/HOMS_YONGJINBAN_android.apk?fileCode=38&sourceType=4');

    AppDownLoadButton.sub_button[0] = ButtonIPhoneApp;
    AppDownLoadButton.sub_button[1] = ButtonAndroidApp;

    var ButtonRegister= new ButtonUrl('注册','http://test2.niujinwang.com/mobile/#/signup');
    var ButtonLogin = new ButtonUrl('登录','http://test2.niujinwang.com/mobile/#/login');
    var ButtonUser = new ButtonUrl('个人中心','http://test2.niujinwang.com/mobile/#/user');
    var ButtonWeixin = new ButtonClick('绑定微信','binding');

    MyAccountButton.sub_button[0] = ButtonRegister;
    MyAccountButton.sub_button[1] = ButtonLogin;
    MyAccountButton.sub_button[2] = ButtonUser;
    MyAccountButton.sub_button[3] = ButtonWeixin;

    var obj = {
        button: [
            StockButton,
            AppDownLoadButton,
            MyAccountButton
        ]
    };
    return JSON.stringify(obj);
}

function getToken(cb) {
    //if (!global.weixin_token || global.weixin_token.expires < Date.now()) {
        console.log('weixin getToken');
        needle.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx1269a608e8627e89&secret=5179dd37d74f4c028934613e2b483743', function(err, resp, body) {
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
}

function sendMenu() {
    var postData = getManagerMenu();
    postToWeixin('https://api.weixin.qq.com/cgi-bin/menu/create?access_token=', postData, {});
}

function postToWeixin(url, content, options) {
    getToken(function(err, token) {
        if (err) {
            return;
        }
        console.log('Weixin token:' + token);
        console.log('Weixin data:' + content);
        needle.post(url + token, content, options, function(err, resp, body) {
            if (err) {
                console.log(err);
            }
            console.log(body);
        });
    });
}

