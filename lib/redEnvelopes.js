var md5 = require('MD5'),
	request = require('request'),
	moment = require('moment'),
	xml2js = require('xml2js');
var num_mch_billno = 0;

module.exports.sendRE = function(re_openid, amount, total_num, wishes, act_name, remark, type){
    var mch_id = '1260898201';
    var wxappid = 'wx8e029a336ad0a880';
    var nickname = '';
    var sendname = '';
    var logo_imgurl = '';
	var banner_imgurl = '';
	var watermark_imgurl = '';
	var client_ip = '127.0.0.1';

    var mch_billno;
	if(type == 0){
		var opts = {
	        nonce_str: '',
	        sign: '',
	        mch_billno: generateMchBillNO(mch_id),
	        mch_id: mch_id,
	        wxappid: wxappid,
	        nick_name: nickname,
	        send_name:sendname,
	        re_openid: re_openid,
	        total_amount: amount,
	        min_value: amount,
	        max_value: amount,
	        total_num: total_num,
	        wishing: wishes,
	        client_ip: client_ip,
	        act_name: act_name,
	        remark: remark,
	        logo_imgurl: logo_imgurl
	    };
	}
	else{
		var opts = {
	        nonce_str: '',
	        sign: '',
	        mch_billno: generateMchBillNO(mch_id),
	        mch_id: mch_id,
	        wxappid: wxappid,
	        //nick_name: nickname,
	        send_name:sendname,
	        re_openid: re_openid,
	        total_amount: amount,
	        //min_value: amount,
	        //max_value: amount,
	        total_num: total_num,
			amt_type: 'ALL_RAND',
			amt_list: '',
	        wishing: wishes,
	        client_ip: client_ip,
	        act_name: act_name,
	        remark: remark,
	        //logo_imgurl: logo_imgurl
			watermark_imgurl: watermark_imgurl,
			banner_imgurl: banner_imgurl
		};
	}
    sendRedEnvelopes(opts, type, function(err, result){
		console.log(result);
	});
}

var generateMchBillNO = function(mch_id){
    if(num_mch_billno>9999999999)
        num_mch_billno = 0;
    else
        num_mch_billno++;
    var str = num_mch_billno.toString();
    var ret = mch_id;
    ret += moment().format('YYYYMMDD');

    if(str.length < 10){
	        for(var i=0; i<10-str.length; i++){
			            ret += '0';
			        }
	    }
    ret += str;
    return ret;
}

var sendRedEnvelopes = function(opts, type, fn){
	//type:0 single redEnvelope
	//type:1 group redEnvelope
	if(type == 1)
		var wc_redEnvelopes_url = "https://api.mch.weixin.qq.com/mmpaymkttransfers/sendgroupredpack";
	else
		var wc_redEnvelopes_url = "https://api.mch.weixin.qq.com/mmpaymkttransfers/sendredpack";
    var pfx = opts.pfx;

    opts.nonce_str = _generateNonceString(32);
    opts.max_value = opts.nin_value = opts.total_amount;
    opts = _sign(opts);

    var builder = new xml2js.Builder();
    var xml = builder.buildObject({xml:opts});

    request({
		url:wc_redEnvelopes_url,
		method: 'POST',
		body: xml,
		agentOptions:{
			pfx: pfx,
			passphrase: opts.mch_id
		}
	},
	function(err, response, body){
		var parser = new xml2js.Parser({trim:true, explicitArray:false, explicitToot:false});
		parser.parseString(body, fn||function(err,result){});
	});

}

var _sign = function(obj){
    var partner_key = obj.partner_key || "";
    ['key','pfx', 'partner_key', 'sign'].forEach(function(k){
	        delete obj[k];
	    });
    var querystring = Object.keys(obj).filter(function(key){
	        return obj[key] !== undefined && obj[key] !=='';
	    }).sort().map(function(key){
	        return key + '=' + obj[key];
	    }).join('&') + "&key=" + partner_key;

    obj.sign = md5(querystring).toUpperCase();
    return obj;
}

var _generateNonceString = function(length){
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var maxPos = chars.length;
    var noceStr = "";
    for(var i=0; i<(length||32); i++){
	        noceStr += chars.charAt(Math.floor(Math.random()*maxPos));
	    }
    return noceStr;
}
