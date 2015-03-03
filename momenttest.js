var moment = require('moment');
var _ = require('lodash');

    var vm = {user:'cxwcfea', amount:20, profile: {email:'cxwcfea@163.com', name:'cxwcfea'}};
	var orders = [
		{
			createdAt: 100,
			status: false
		},
		{
			createdAt: 200,
			status: true 
		}
	];
    var ob = _.extend(vm, {
        orders: orders.map(function(order){
            return {
                date: order.createdAt,
                status: order.status,
            };
        })
    });

console.log(ob);

moment.locale('zh-cn');
console.log(moment().startOf('hour').fromNow());
console.log(moment(Date.now()).format('ll'));

/*
var test_str = "This is a test text, here is PLACE_HOLDER which should be replaced by number";
var new_str = test_str.replace('PLACE_HOLDER', '235876');
console.log(new_str);

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var random_str = "";
for (var i = 0; i < 6; ++i) {
	random_str += getRandomInt(0, 9);
}
console.log(random_str);
*/

var message_str = "感谢您使用牛金网,您的验证码为:PLACE_HOLDER,请勿向任何人提供此短信验证码。【牛金网】";

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

function generateVerifyCode() {
    var verify_code = "";
    for (var i = 0; i < 6; ++i) {
        verify_code += getRandomInt(0, 9);
    }
    return verify_code;
};

var sendSMS = function(mobile_num){
    var message_content = message_str.replace('PLACE_HOLDER', generateVerifyCode());
    var postData = {
        mobile: mobile_num,
        message: message_content
    };
	console.log(postData.message);
};

sendSMS(123);
