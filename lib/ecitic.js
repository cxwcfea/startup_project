var xml = require("xml"),
    util = require('./util'),
    needle = require('needle'),
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

module.exports.requestPay = function(orderID, bankName, cardID, userName, amount, cb) {
    var obj = getBaseObj();

    var bankID = bankCode[bankName];
    if (!bankID) {
        return cb('not support this bank');
    }

    obj.stream.push({action:'DLOUTTRN'});
    obj.stream.push({clientID:util.generateSerialID()});
    obj.stream.push({preFlg:'0'});
    obj.stream.push({payType:'05'});
    //obj.stream.push({recBankNo:bankID});
    obj.stream.push({recBankNo:'302100011000'});
    //obj.stream.push({payAccountNo:accountNo});
    obj.stream.push({payAccountNo:'7111010182600196886'});
    //obj.stream.push({recAccountNo:cardID});
    obj.stream.push({recAccountNo:'7111010192087007800'});
    //obj.stream.push({recAccountName:userName});
    obj.stream.push({recAccountName:'对私测试客户'});
    obj.stream.push({citicbankFlag:'1'});
    obj.stream.push({cityFlag:'1'});
    //obj.stream.push({tranAmount:Number(amount)});
    obj.stream.push({tranAmount:1});

    var data = xml(obj, infoObj);
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
