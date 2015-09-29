var xml = require("xml"),
    util = require('./util'),
    needle = require('needle'),
    encoding = require("encoding"),
    request = require('request'),
    iconv = require('iconv-lite'),
    xml2js = require("xml2js");

var accountNo = '7112610182600097391';
var url = 'http://10.0.0.4:6789';
if (process.env.NODE_ENV === 'production') {
    url = 'http://106.120.248.170:6789'
}

var bankCode = {
    '工商银行': '102100099996',
    '建设银行': '105100000017',
    '农业银行': '103100000026',
    '中国银行': '104100000004',
    '招商银行': '308584000013',
    '邮政储蓄银行': '403100000004',
    '广发银行': '306581000003',
    '光大银行': '303100000006',
    '兴业银行': '309391000011',
    '北京银行': '313100000013',
    '浦发银行': '310290000013',
    '民生银行': '305100000013',
    '中信银行': '302100011000',
    '华夏银行': '304100040000',
    '平安银行': '307584007998',
    '宁波银行': '313332082914',
    '上海银行': '313290000017',
    '交通银行': '301290000007'
};

var infoObj = {
    declaration:{
        version: '1.0', encoding: 'GBK'
    }
};

function getBaseObj() {
    var obj = {
        stream: [
            {
                userName:'XNPH'
            }
        ]
    };
    return obj;
}

module.exports.checkOrderStatus = function(orderTransID, cb) {
    var obj = getBaseObj();
    obj.stream.push({action:'DLCIDSTT'});
    obj.stream.push({clientID:orderTransID});
    var data = xml(obj, infoObj);
    console.log(data);
    needle.post(url, data, {}, function(err, resp, body) {
        if (err) {
            console.log('zhongxin checkOrderStatus err1:' + err.toString());
            cb(err);
        } else {
            var parseString = xml2js.parseString;
            parseString(body, function (error, result) {
                console.log(result);
                if (error) {
                    console.log('zhongxin checkOrderStatus err2:' + error.toString());
                    cb(error);
                } else {
                    if (result.stream && result.stream.list && result.stream.list && result.stream.list[0]) {
                        if (result.stream.list[0].row[0].status[0] === 'AAAAAAA') {
                            console.log('order pay success');
                            cb(null, 'success');
                        } else {
                            console.log('zhongxin pay check fail:' + result.stream.list[0].row[0]);
                            cb(result.stream.list[0].row[0].statusText);
                        }
                    } else {
                        error = body;
                        console.log('zhongxin checkOrderStatus err3:' + error);
                        cb(error);
                    }
                }
            });
        }
    });
};

module.exports.requestPay = function(orderTansID, bankName, cardID, userName, amount, cb) {
    var obj = getBaseObj();

    var bankID = bankCode[bankName];
    if (!bankID) {
        return cb('not support this bank');
    }

    amount = Number(amount);
    obj.stream.push({action:'DLOUTTRN'});
    obj.stream.push({clientID:orderTansID});
    obj.stream.push({preFlg:'0'});
    obj.stream.push({payType:'05'});
    obj.stream.push({recBankNo:bankID});
    obj.stream.push({payAccountNo:accountNo});
    obj.stream.push({recAccountNo:cardID});
    obj.stream.push({recAccountName:userName});
    obj.stream.push({citicbankFlag:'1'});
    obj.stream.push({cityFlag:'1'});
    obj.stream.push({tranAmount:amount});

    var data = xml(obj, infoObj);
    var resultBuffer = encoding.convert(data, 'GBK');
    request({
        url: url,
        method: "POST",
        headers: {
            "content-type": "application/xml"  // <--Very important!!!
        },
        body: resultBuffer,
        encoding: null
    }, function (error, response, body){
        if (error) {
            console.log('zhongxin pay error1:' + error.toString());
            cb(error);
        } else {
            body = iconv.decode(body, 'gb2312');
            var parseString = xml2js.parseString;
            parseString(body, function (error, result) {
                if (error) {
                    console.log('zhongxin pay err2:' + error.toString());
                    cb(error);
                } else {
                    if (result.stream.status[0] === 'AAAAAAE' || result.stream.status[0] === 'AAAAAAA') {
                        cb(null, result.stream.tranNo[0]);
                    } else {
                        error = body;
                        console.log('zhongxin pay err3:' + error);
                        cb(error);
                    }
                }
            });
        }
    });
    /*
    needle.post(url, data, {}, function(err, resp, body) {
        if (err) {
            console.log('zhongxin pay err:' + err.toString());
            cb(err);
        } else {
            var parseString = xml2js.parseString;
            parseString(body, function (error, result) {
                if (error) {
                    console.log('zhongxin pay err:' + error.toString());
                    cb(error.toString());
                } else {
                    if (result.stream.status[0] === 'AAAAAAE') {
                        cb(null, result);
                    } else {
                        error = body;
                        console.log('zhongxin pay err:' + error);
                        cb(error);
                    }
                }
            });
        }
    });
    */
};

module.exports.test = function(req, res, next) {
    // 余额查询
    var data = xml({stream: [{action:'DLBALQRY'}, {userName:'XNPH'}, {list: [{ _attr: { name: 'userDataList' }}, {row:[{accountNo:accountNo}]}]}]}, { declaration: { version: '1.0', encoding: 'GBK' }});

    // 银行列表查询
    //var data = xml({stream: [{action:'DLOBKQRY'}, {userName:'XNPH'}]}, { declaration: { version: '1.0', encoding: 'GBK' }});

    //console.log(resultBuffer.toString());
    // 对外支付
    /*
     var data = xml({stream: [{action:'DLOUTTRN'}, {userName:'XNPH'}, {clientID:'555d518446da0f11'}, {preFlg:'0'}, {payType:'05'},
     {recBankNo:'302100011000'}, {payAccountNo:'7111010182600196886'}, {recAccountNo:'7111010192087007800'},
     {recAccountName:'对私测试客户'}, {citicbankFlag:'1'}, {cityFlag:'0'}, {tranAmount:1}]}, { declaration: { version: '1.0', encoding: 'GBK' }});
     */

    // 交易状态查询
    //var data = xml({stream: [{action:'DLCIDSTT'}, {userName:'XNPH'}, {clientID:'2015060514156970'}]}, { declaration: { version: '1.0', encoding: 'GBK' }});

    //var data = xml({stream: [{action:'DLOTHCOL'}, {userName:'XNPH'}, {startDate:'20150520'}, {endDate:'20150525'}]}, { declaration: { version: '1.0', encoding: 'GBK' }});
    //var data = xml({stream: [{action:'DLOTHDET'}, {userName:'XNPH'}, {clientID:'555d518446da0f14'}]}, { declaration: { version: '1.0', encoding: 'GBK' }});
    // 其他代付导入
    /*
     var data = xml({stream: [{action:'DLOTHSUB'}, {userName:'XNPH'}, {clientID:'555d518446da0f14'}, {totalNumber:1},
     {totalAmount:1}, {payAccountNo:'7111010182600196886'},
     {preFlg:'0'}, {payType:'05'}, {list: [{ _attr: { name: 'userDataList' }}, {row:[
     {recAccountNo:'7111010192087007800'},
     {recAccountName:'对私测试客户'},
     {tranAmount:1}
     ]}]}]}, { declaration: { version: '1.0', encoding: 'GBK' }});
     */
    //var resultBuffer = encoding.convert(data, 'GBK');

    //var url = 'http://10.0.0.4:6789';
    //var url = 'http://127.0.0.1:81';
    var options = {
        headers: {
            'Content-Type': 'text/html; charset=gbk'
        }
    };
    needle.post(url, data, {}, function(err, resp, body) {
        console.log(err);
        if (!err) {
            console.log(body);
            var parseString = xml2js.parseString;
            parseString(body, function (err, result) {
                res.send(result);
                console.dir(result);
                if (result.stream.status[0] === 'AAAAAAA') {
                    console.log('success');
                }
            });
        } else {
            res.send(err);
        }
    });

    /*
     request({
     url: "http://10.0.0.4:6789",
     method: "POST",
     headers: {
     "content-type": "application/xml"  // <--Very important!!!
     },
     body: resultBuffer
     }, function (error, response, body){
     console.log(error);
     console.log(response);
     console.log(body);
     });
     */

    /*
     var data = ecitic.requestPay('abcd', 'bank', 'card', 'name', 8, function(err) {
     if (err) {
     console.log(err.toString());
     } else {
     console.log('success');
     }
     });
     */
    /*
    exports.checkOrderStatus('2015060411547288', function(err) {
        if (err) {
            console.log(err.toString());
        } else {
            console.log('success');
        }
    });
    */
};

/*
module.exports.generateMultiPayCode = function(orderID, bankID, cardID, userName, amount) {
    var obj = getBaseObj();

    obj.stream.push({action:'DLOTHSUB'});
    obj.stream.push({clientID:orderID});
    obj.stream.push({preFlg:'0'});
    obj.stream.push({payType:'05'});
    obj.stream.push({recBankNo:bankID});
    obj.stream.push({payAccountNo:accountNo});
    obj.stream.push({recAccountNo:cardID});
    obj.stream.push({recAccountName:userName});
    obj.stream.push({citicbankFlag:'1'});
    obj.stream.push({cityFlag:'1'});
    obj.stream.push({tranAmount:amount});

    return xml(obj, infoObj);
};
*/
