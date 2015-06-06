var crypto = require("crypto"),
    User = require('../models/User'),
    needle = require('needle'),
    xml2js = require('xml2js'),
    xml = require('xml'),
    moment = require('moment'),
    redis = require("redis"),
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
    this.url = 'http://www.niujinwang.com/mobile/';
    this.topcolor = '#FF0000';
    this.data = Data;
}

function SuccessRecharge(first, accountName, accountType, amount, result, remark) {
    this.first = first;
    this.account = accountName;
    this.accountType = accountType;
    this.amount = amount;
    this.result = result;
    this.remark = remark;
}

function AccountExpire(First,AccountName,Date,Remark) {
    this.first = First;
    this.productname = AccountName;
    this.date = Date;
    this.remark = Remark;
}

function AccountReady(first, type, account, password, remark) {
    this.first = first;
    this.keyword1 = type;
    this.keyword2 = account;
    this.keyword3 = password;
    this.remark = remark;
}

function BalanceChange(first, type, amount, date, remark) {
    this.first = first;
    this.keyword1 = type;
    this.keyword2 = amount;
    this.keyword3 = date;
    this.remark = remark;
}

function sendRechargeSuccessMsg(mobile, amount, openID) {
    var fstElement = new ModuleElement('充值成功','#000000');
    var accountTypeElement = new ModuleElement('牛金帐号', '#000000');
    var accountElement = new ModuleElement(mobile,'#173177');
    var amountElement = new ModuleElement(amount.toFixed(2) + '元','#173177');
    var resultElement = new ModuleElement('充值成功','#00FF00');
    var remarkElement = new ModuleElement('如有疑问，请联系客服4006921388','#000000');

    var data = new SuccessRecharge(fstElement, accountElement, accountTypeElement, amountElement, resultElement,remarkElement);

    var sendData = new BaseModule(openID,'DUYdkU-NelLhgPV5UxKfXk7KBM4rF8blpTlk6bdGEcQ', data);

    //console.log(sendData);
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}

function sendAccountExpireMsg(account, date, openID) {
    var fstElement = new ModuleElement('您的交易账号即将到期','#173177');
    var accountElement = new ModuleElement(account,'#173177');
    var dateElement = new ModuleElement(date,'#173177');
    var remarkElement = new ModuleElement('请您于今天申请延期，或者于明天收盘前清仓，以免影响您的交易','#173177');

    var data = new AccountExpire(fstElement,accountElement,dateElement,remarkElement);

    var sendData = new BaseModule(openID,'T6mdpjTAKGGuEUxO0_ocPL7YBxi8RRZReN5MpsKZISQ', data);

    //console.log(sendData);
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}

function sendAccountReadyMsg(accountType, account, password, openID) {
    var fstElement = new ModuleElement('您的交易账户已开通','#173177');
    var accountTypeElement = new ModuleElement(accountType,'#173177');
    var accountElement = new ModuleElement(account,'#173177');
    var passwordElement = new ModuleElement(password,'#173177');
    var remarkElement = new ModuleElement('您可在登录交易软件后修改密码，祝您投资愉快!','#173177');

    var data = new AccountReady(fstElement, accountTypeElement, accountElement, passwordElement, remarkElement);

    var sendData = new BaseModule(openID,'as-eJyN99l1zWADNlp1X3_40Xve4xgCn8tRZcNdmQzc', data);

    //console.log(sendData);
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}

function sendBalanceChangeMsg(type, amount, openID) {
    var fstElement = new ModuleElement('您的账户资金发生以下变动','#173177');
    var typeElement = new ModuleElement(type,'#173177');
    var amountElement = new ModuleElement(amount.toFixed(2),'#173177');
    var dateElement = new ModuleElement(moment().format('YYYY-MM-DD HH:mm:ss'),'#173177');
    var remarkElement = new ModuleElement('感谢您的关注，祝您投资愉快!','#173177');

    var data = new BalanceChange(fstElement, typeElement, amountElement, dateElement, remarkElement);

    var sendData = new BaseModule(openID,'JVqXK5_llV1QL0ckxpIlH5rKFFT-vW_yYorhpALSsgY', data);

    //console.log(sendData);
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}

function sendTemplateMsg(t_id, openID, data) {
    switch (t_id) {
        case '1':
            sendRechargeSuccessMsg(data.mobile, data.amount, openID);
            break;
        case '2':
            sendAccountExpireMsg(data.account, moment(data.date).format('YYYY-MM-DD HH:mm:ss'), openID);
            break;
        case '3':
            sendAccountReadyMsg(data.type, data.account, data.password, openID);
            break;
        case '4':
            sendBalanceChangeMsg(data.type, data.amount, openID);
            break;
        default :
            sendRechargeSuccessMsg(openID);
            break;
    }
}

module.exports.sendWeixinTemplateMsg = function(userMobile, data) {
    User.findOne({mobile:userMobile}, function(err, user) {
        if (err) {
            console.log('sendTemplateMsg err:' + err.toString());
            return;
        }
        if (!user) {
            console.log('sendTemplateMsg err:user not found');
            return;
        }
        if (!user.profile.weixin_id) {
            console.log('sendTemplateMsg err:user not band weixin');
            return;
        }
        sendTemplateMsg(data.t_id.toString(), user.profile.weixin_id, data);
    });
};

module.exports.testTemplateMsg = function(req, res) {
    var num = req.query.t;
    var mobile = req.query.mobile;
    User.findOne({mobile:mobile}, function(err, user) {
        if (err) {
            res.status(500);
            return res.send({error_msg:err.toString()});
        }
        if (!user) {
            res.status(403);
            return res.send({error_msg:'user not found'});
        }
        if (!user.profile.weixin_id) {
            res.status(403);
            return res.send({error_msg:'user not band weixin id'});
        }
        sendTemplateMsg(num, user.profile.weixin_id);
        res.send({});
    });
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
                Content: {_cdata: '欢迎关注牛金网！配资相关问题请联系客服:\nQQ:4006921388\n电话:400-692-1388'}
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

function transferCustomerService(res, inData) {
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
                MsgType: {_cdata: 'transfer_customer_service'}
            }
        ]
    };
    var ret = xml(xmlObj);
    res.send(ret);
}

function sendBindTemplateMsg(res, inData) {
    User.findOne({'profile.weixin_id':inData.FromUserName[0]}, function(err, user) {
        if (err) {
            sendTextMsg(res, inData, '服务器忙，请稍后再试');
        } else {
            if (user) {
                sendTextMsg(res, inData, '您的微信号已经与下面的牛金网id绑定：\n' + user.mobile);
            } else {
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
                            MsgType: {_cdata: 'news'}
                        },
                        {
                            ArticleCount: 1
                        },
                        {
                            Articles: [
                                {
                                    item: [
                                        {
                                            Title: {_cdata: '绑定微信号'}
                                        },
                                        {
                                            Description: {_cdata: '将您的微信号和牛金网账号绑定，以获取更多服务'}
                                        },
                                        {
                                            PicUrl: {_cdata: 'http://www.niujinwang.com/images/connect_weixin.jpg'}
                                        },
                                        {
                                            Url: {_cdata: 'http://www.niujinwang.com/mobile/#/weixin_band?w='+inData.FromUserName[0]}
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                };
                var ret = xml(xmlObj);
                res.send(ret);
            }
        }
    });
}

function handleTextMsg(res, inData) {
    var content = inData.Content[0];
    handleRandomText(res, inData);
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
        //console.log('handlePostMessage data ' + postData);
        xml2js.parseString(postData, function(err, result) {
            if (err) {
                console.log('handlePostMessage ' + err.toString());
                res.send({});
            } else {
                if (result.xml && result.xml.FromUserName && result.xml.Event) {
                    if (result.xml.Event[0] == 'subscribe') {
                        handleSubscribe(res, result.xml);
                    } else if (result.xml.Event[0] == 'CLICK' && result.xml.EventKey[0] == 'binding') {
                        sendBindTemplateMsg(res, result.xml);
                    } else if (result.xml.FromUserName[0] && result.xml.Event[0] == 'VIEW') {
                        //var openID = result.xml.FromUserName[0];
                        //console.log('user openID ' + openID);
                        res.send({});
                    }
                } else if (result.xml && result.xml.MsgType) {
                    if (result.xml.MsgType == 'text') {
                        handleTextMsg(res, result.xml);
                    } else {
                        res.send({});
                    }
                } else { // default send empty msg to prevent weixin resend the msg
                    res.send({});
                }
            }
        });
    });
}

function handleTextMsg(res, inData) {
    var content = inData.Content[0];
    if (content === '联系客服') {
        transferCustomerService(res, inData);
    } else {
        handleRandomText(res, inData);
    }
}

module.exports.handlePostMessage = function(req, res) {
    var postData = "";
    req.setEncoding("utf8");
    req.addListener("data", function(postDataChunk) {
        postData += postDataChunk;
    });
    req.addListener("end", function() {
        xml2js.parseString(postData, function(err, result) {
            if (err) {
                console.log('handlePostMessage ' + err.toString());
                res.send({});
            } else {
                if (result.xml && result.xml.FromUserName && result.xml.Event) {
                    if (result.xml.Event[0] == 'subscribe') {
                        handleSubscribe(res, result.xml);
                    } else if (result.xml.Event[0] == 'CLICK' && result.xml.EventKey[0] == 'binding') {
                        sendBindTemplateMsg(res, result.xml);
                    } else if (result.xml.FromUserName[0] && result.xml.Event[0] == 'VIEW') {
                        //var openID = result.xml.FromUserName[0];
                        //console.log('user openID ' + openID);
                        res.send({});
                    }
                } else if (result.xml && result.xml.MsgType) {
                    if (result.xml.MsgType == 'text') {
                        handleTextMsg(res, result.xml);
                    } else {
                        res.send({});
                    }
                } else { // default send empty msg to prevent weixin resend the msg
                    res.send({});
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

    var ButtonFreeTry = new ButtonUrl('免费体验','http://www.niujinwang.com/mobile/#/exp');
    var ButtonDaysNiu = new ButtonUrl('天天牛','http://www.niujinwang.com/mobile/#/ttn');

    StockButton.sub_button[0] = ButtonFreeTry;
    StockButton.sub_button[1] = ButtonDaysNiu;

    var ButtonIPhoneApp = new ButtonUrl('iPhone版','https://itunes.apple.com/cn/app/homs-yong-jin-ban/id950510961?mt=8');
    var ButtonAndroidApp = new ButtonUrl('Android版','http://www.ihoms.com/file/xunlei/downloadxunlei/HOMS_YONGJINBAN_android.apk?fileCode=38&sourceType=4');

    AppDownLoadButton.sub_button[0] = ButtonIPhoneApp;
    AppDownLoadButton.sub_button[1] = ButtonAndroidApp;

    var ButtonUser = new ButtonUrl('个人中心','http://www.niujinwang.com/mobile/#/user');
    var ButtonWeixin = new ButtonClick('绑定微信','binding');

    MyAccountButton.sub_button[0] = ButtonUser;
    MyAccountButton.sub_button[1] = ButtonWeixin;

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
    global.redis_client.get('weixin_token', function(err, reply) {
        if (!err && reply) {
            console.log('restore weixin token ' + reply);
            cb(null, reply);
        } else {
            console.log('fetch new weixin token');
            needle.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx182b3688b9b060f7&secret=13ea8e4782476ccdf2d58bbbb1634513', function(err, resp, body) {
                if (err) {
                    console.log('get Weixin token err:' + err.toString());
                    cb(err);
                } else {
                    global.redis_client.set('weixin_token', body.access_token, redis.print);
                    global.redis_client.expire('weixin_token', 7100, redis.print);
                    cb(null, body.access_token);
                }
            });
        }
    });
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
        //console.log('Weixin token:' + token);
        //console.log('Weixin data:' + content);
        needle.post(url + token, content, options, function(err, resp, body) {
            if (err) {
                console.log(err);
            }
            //console.log(body);
        });
    });
}

