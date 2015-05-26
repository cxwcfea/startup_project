var xml = require("xml"),
    util = require('./util'),
    needle = require('needle'),
    encoding = require("encoding"),
    request = require('request'),
    xml2js = require("xml2js");

var accountNo = '7111010182600196886';
var url = 'http://10.0.0.4:5128';

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
    '上海银行': '313290000017'
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
    //var data = xml({stream: [{action:''}, {userName:'XNPH'}, {clientID:'555d518446da0f14'}]}, { declaration: { version: '1.0', encoding: 'GBK' }});
    obj.stream.push({action:'DLOTHDET'});
    obj.stream.push({clientID:orderTransID});
    var data = xml(obj, infoObj);
    needle.post(url, data, {}, function(err, resp, body) {
        if (err) {
            console.log('zhongxin checkOrderStatus err1:' + err.toString());
            cb(err);
        } else {
            var parseString = xml2js.parseString;
            parseString(body, function (error, result) {
                if (error) {
                    console.log('zhongxin checkOrderStatus err2:' + error.toString());
                    cb(error);
                } else {
                    if (result.stream && result.stream.list && result.stream.list && result.stream.list[0]) {
                        if (result.stream.list[0].row[0].status[0] === 'AAAAAAA') {
                            console.log('order pay success');
                        }
                        cb(null, 'success');
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

    /*
    var bankID = bankCode[bankName];
    if (!bankID) {
        return cb('not support this bank');
    }
    */

    var oid = util.generateSerialID();
    console.log(oid);
    obj.stream.push({action:'DLOTHSUB'});
    obj.stream.push({clientID:oid.toString()});
    obj.stream.push({totalNumber:1});
    obj.stream.push({totalAmount:amount});
    //obj.stream.push({payAccountNo:accountNo});
    obj.stream.push({payAccountNo:'7111010182600196886'});
    obj.stream.push({preFlg:'0'});
    var list = [];
    obj.stream.push({list:list});

    list.push({_attr:{name:'userDataList'}});
    var row = [];
    list.push({row:row});
    //row.push({recAccountNo:cardID});
    row.push({recAccountNo:'7111010192087007800'});
    //row.push({recAccountName:userName});
    row.push({recAccountName:'对私测试客户'});
    //row.push({tranAmount:Number(amount)});
    row.push({tranAmount:amount});

    var data = xml(obj, infoObj);
    var resultBuffer = encoding.convert(data, 'GBK');
    request({
        url: url,
        method: "POST",
        headers: {
            "content-type": "application/xml"  // <--Very important!!!
        },
        body: resultBuffer
    }, function (error, response, body){
        if (error) {
            console.log('zhongxin pay error1:' + error.toString());
            cb(error);
        } else {
            var parseString = xml2js.parseString;
            parseString(body, function (error, result) {
                if (error) {
                    console.log('zhongxin pay err2:' + error.toString());
                    cb(error);
                } else {
                    if (result.stream.status[0] === 'AAAAAAE' || result.stream.status[0] === 'AAAAAAA') {
                        cb(null, result);
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
