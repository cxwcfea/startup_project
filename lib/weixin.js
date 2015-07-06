var crypto = require("crypto"),
    User = require('../models/User'),
    needle = require('needle'),
    xml2js = require('xml2js'),
    xml = require('xml'),
    moment = require('moment'),
    redis = require("redis"),
    util = require('util');

var token = '8CAD6DE09F1AEB';
var customFlag = false;
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
    //var sendData = new BaseModule(openID,'dO_7xn28VvMKJRDmiReTY-8xR122RW2WodDurAF5zcs', data); //server2

    //console.log(sendData);
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}

function sendAccountExpireMsg(account, date, openID) {
    var fstElement = new ModuleElement('您的交易账号即将到期','#000000');
    var accountElement = new ModuleElement(account,'#173177');
    var dateElement = new ModuleElement(date,'#173177');
    var remarkElement = new ModuleElement('请您于今天申请延期，或者于明天收盘前清仓，以免影响您的交易','#000000');

    var data = new AccountExpire(fstElement,accountElement,dateElement,remarkElement);

    var sendData = new BaseModule(openID,'gGCJC49MUvZ-nd-5_zE-6zHJ9-TkmmyPXg10cYAjNqE', data);

    //console.log(sendData);
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}

function sendAccountReadyMsg(accountType, account, password, openID) {
    var fstElement = new ModuleElement('您的交易账户已开通','#000000');
    var accountTypeElement = new ModuleElement(accountType,'#173177');
    var accountElement = new ModuleElement(account,'#173177');
    var passwordElement = new ModuleElement(password,'#173177');
    var remarkElement = new ModuleElement('您可在登录交易软件后修改密码，祝您投资愉快!','#000000');

    var data = new AccountReady(fstElement, accountTypeElement, accountElement, passwordElement, remarkElement);

    var sendData = new BaseModule(openID,'as-eJyN99l1zWADNlp1X3_40Xve4xgCn8tRZcNdmQzc', data);

    //console.log(sendData);
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}
function sendBalanceChangeMsg1(type, amount, date, openID) {
    var fstElement = new ModuleElement('您的账户资金发生以下变动','#000000');
    var typeElement = new ModuleElement(type,'#173177');
    var amountElement = new ModuleElement(amount.toFixed(2),'#173177');
    var dateElement = new ModuleElement(date,'#173177');
    var remarkElement = new ModuleElement('感谢您的关注，祝您投资愉快!','#000000');

    var data = new BalanceChange(fstElement, typeElement, amountElement, dateElement, remarkElement);

    var sendData = new BaseModule(openID,'JVqXK5_llV1QL0ckxpIlH5rKFFT-vW_yYorhpALSsgY', data);
    //var sendData = new BaseModule(openID,'a_aqhjNqDQ1tQJ-LSdVtFd9nEYMS6GeK_Nbcqwflvzg', data);//server2
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}

function sendBalanceChangeMsg(type, amount, openID) {
    var fstElement = new ModuleElement('您的账户资金发生以下变动','#000000');
    var typeElement = new ModuleElement(type,'#173177');
    var amountElement = new ModuleElement(amount.toFixed(2),'#173177');
    var dateElement = new ModuleElement(moment().format('YYYY-MM-DD HH:mm:ss'),'#173177');
    var remarkElement = new ModuleElement('感谢您的关注，祝您投资愉快!','#000000');

    var data = new BalanceChange(fstElement, typeElement, amountElement, dateElement, remarkElement);

    var sendData = new BaseModule(openID,'JVqXK5_llV1QL0ckxpIlH5rKFFT-vW_yYorhpALSsgY', data);
    //var sendData = new BaseModule(openID,'a_aqhjNqDQ1tQJ-LSdVtFd9nEYMS6GeK_Nbcqwflvzg', data);//server2
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}
function sendAccountOpMsg(content, openID){
    var fstElement = new ModuleElement('您好，新消息提醒','#000000');
    var themeElement = new ModuleElement('帐号变动通知','#173177');
    var contentElement = new ModuleElement(content,'#173177');
    var dateElement = new ModuleElement(moment().format('YYYY-MM-DD HH:mm:ss'),'#173177');
    var remarkElement = new ModuleElement('感谢您的支持！','#000000');

    var data = new BalanceChange(fstElement, themeElement, contentElement, dateElement, remarkElement);

    //var sendData = new BaseModule(openID,'vgcbIaIrDtGG_auyN12Y1Lc3KeGrxzWBHFY3d5kJHE4', data);//server2
    var sendData = new BaseModule(openID,'ZU_CwLz0i1-vggF_n-VHp5JdEFxHIQ1hHEp5LZZ6WYA', data);

    //console.log(sendData);
    var options = {
        json: true
    };
    postToWeixin('https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=', sendData, options);
}
function sendSettlementMsg(account, amount, deposit, openID){
    var fstElement = new ModuleElement('您好，账户结算完成','#000000');
    var accountElement = new ModuleElement(account,'#173177');
    var amountElement = new ModuleElement(amount,'#173177');
    var depositElement = new ModuleElement(deposit,'#173177');
    var remarkElement = new ModuleElement('结算金额已返还，祝您投资愉快！','#000000');

    var data = new BalanceChange(fstElement, accountElement, amountElement, depositElement, remarkElement);
    var sendData = new BaseModule(openID,'pFCVZdxPV3L9-P4dmI_DGuvh6MC48DMVok7i94Hsc4U', data);
    //var sendData = new BaseModule(openID,'dlAcfhZp5GmgPVMPWCsPHJYgK7VsFT-f2WgZDyipQls', data);//server2
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
	case '5':
	    sendAccountOpMsg(data.content, openID);
	    break;
	case '6':
	    sendSettlementMsg(data.account, data.amount, data.deposit, openID);
	case '7':
	    sendBalanceChangeMsg1(data.type, data.amount, data.date, openID);
        default :
            //sendRechargeSuccessMsg(openID);
            break;
    }
}

module.exports.sendWeixinTemplateMsg = function(userMobile, data) {
    if (process.env.NODE_ENV != 'production') {
        console.log('weixin only work on production');
        return;
    }
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
                Content: {_cdata: '亲，您怎么现在才来！欢迎关注牛金网！\n\n［牛金网业务］\n牛金网致力于提供行业内最优质的配资服务和投资赚钱业务，您的专属理财平台！/微笑\n\n［牛金网福利］\n' +
                    '盈利归你，亏损算我。免费提供2000元股票操盘体验资金，狂砸3亿陪你玩儿！赶紧来吧：“配资炒股”  👉 "免费体验" \n\n ✨领红包看这里✨  \n' +
                    '现金红包早准备好了！快添加您的神秘好友“牛小金”（微信号：nxj201503，👈不定期神秘好礼送），火速领取吧！'}
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
    //var greetings  = '正在为您转接客服中，请稍后^_^';
    //sendTextMsg(res, inData, greetings);
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
	transferCustomerService(res, inData);
}

function handleVoiceMsg(res, inData){
	transferCustomerService(res, inData);
}

module.exports.handlePostMessage = function(req, res) {
    if (process.env.NODE_ENV != 'production') {
        console.log('weixin only work on production');
        res.send({});
        return;
    }
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
                    } else if (result.xml.Event[0] == 'CLICK' && result.xml.EventKey[0] == 'customer_service') {
						var greetings  = '您好，感谢关注小牛！^_^您直接点击左下方小键盘输入想要咨询的问题即可,也可以直接输入语音,客服MM会在第一时间答复您。';
						sendTextMsg(res, result.xml, greetings);
                    } else if (result.xml.FromUserName[0] && result.xml.Event[0] == 'VIEW') {
                        //var openID = result.xml.FromUserName[0];
                        //console.log('user openID ' + openID);
                        res.send({});
                    }
                } else if (result.xml && result.xml.MsgType) {
                    if (result.xml.MsgType == 'text') {
                        handleTextMsg(res, result.xml);
					} else if(result.xml.MsgType == 'voice'){
						handleVoiceMsg(res, result.xml);
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
    var ButtonFreeTry = new ButtonUrl('免费体验','http://www.niujinwang.com/mobile/#/exp');
    var ButtonDaysNiu = new ButtonUrl('天天牛','http://www.niujinwang.com/mobile/#/ttn');
    var ButtonMonthNiu = new ButtonUrl('月月牛','http://www.niujinwang.com/mobile/#/yyn');
    var ButtonIPhoneApp = new ButtonUrl('iPhone版下载','https://itunes.apple.com/app/apple-store/id303191318?pt=209867&ct=download10jqka&mt=8');
    var ButtonAndroidApp = new ButtonUrl('Android版下载','http://mobile.10jqka.com.cn/android_zq.html');
    StockButton.sub_button[0] = ButtonFreeTry;
    StockButton.sub_button[1] = ButtonDaysNiu;
    StockButton.sub_button[2] = ButtonMonthNiu;
    StockButton.sub_button[3] = ButtonIPhoneApp;
    StockButton.sub_button[4] = ButtonAndroidApp;

    var InvestmentButton = new ComplexButton('投资赚钱');
    var ButtonInvestment = new ButtonUrl('天天投', 'http://www.niujinwang.com/mobile/#/invest');
    InvestmentButton.sub_button[0] = ButtonInvestment;

    var MyAccountButton = new ComplexButton('服务中心');
    var ButtonUser = new ButtonUrl('个人中心','http://www.niujinwang.com/mobile/#/user');
    var ButtonWeixin = new ButtonClick('绑定微信','binding');
    var ButtonLoginLongterm = new ButtonUrl('免登录','http://www.niujinwang.com/mobile/#/login_longterm');
    var ButtonCustomService = new ButtonClick('联系客服','customer_service');
    MyAccountButton.sub_button[0] = ButtonUser;
    MyAccountButton.sub_button[1] = ButtonWeixin;
    MyAccountButton.sub_button[2] = ButtonLoginLongterm;
    MyAccountButton.sub_button[3] = ButtonCustomService;

    var obj = {
        button: [
            StockButton,
            InvestmentButton,
            MyAccountButton
        ]
    };
    return JSON.stringify(obj);
}

function getToken(cb) {
    if (!global.redis_client) {
        return cb('redis client not init');
    }
    global.redis_client.get('weixin_token', function(err, reply) {
        if (!err && reply) {
            console.log('restore weixin token ' + reply);
            cb(null, reply);
        } else {
            console.log('fetch new weixin token');
            needle.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx182b3688b9b060f7&secret=13ea8e4782476ccdf2d58bbbb1634513', function(err, resp, body) {
            //needle.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx1269a608e8627e89&secret=5179dd37d74f4c028934613e2b483743', function(err, resp, body) { //server2
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

