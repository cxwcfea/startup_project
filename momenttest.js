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

var timevalue = moment().format("YYYYMMDDHHmmSSS");
console.log('today is ' + timevalue);
timevalue += getRandomInt(0,9);
console.log(timevalue);

var xD = new Date();
var otherValue = moment(xD).add(7, 'days');
console.log(otherValue.format("YYYYMMDDHHmmSSS"));

var today = moment().startOf('day').format("YYYYMMDDHHmmSSS");
var tomorrow = moment().endOf('day').add(1, 'ms').format("YYYYMMDDHHmmSSS");
console.log(today);
console.log(tomorrow);
console.log(moment().dayOfYear());

//console.log();
var holiday = [
	moment("2015-03-14").dayOfYear(),
	moment("2015-03-15").dayOfYear(),
	moment("2015-03-21").dayOfYear(),
	moment("2015-03-22").dayOfYear(),
	moment("2015-03-28").dayOfYear(),
	moment("2015-03-29").dayOfYear(),
	moment("2015-04-04").dayOfYear(),
	moment("2015-04-05").dayOfYear(),
	moment("2015-04-06").dayOfYear(),
	moment("2015-04-11").dayOfYear(),
	moment("2015-04-12").dayOfYear(),
	moment("2015-04-18").dayOfYear(),
	moment("2015-04-19").dayOfYear(),
	moment("2015-04-25").dayOfYear(),
	moment("2015-04-26").dayOfYear(),
	moment("2015-05-01").dayOfYear(),
	moment("2015-05-02").dayOfYear(),
	moment("2015-05-03").dayOfYear(),
	moment("2015-05-09").dayOfYear(),
	moment("2015-05-10").dayOfYear(),
	moment("2015-05-16").dayOfYear(),
	moment("2015-05-17").dayOfYear(),
	moment("2015-05-23").dayOfYear(),
	moment("2015-05-24").dayOfYear(),
	moment("2015-06-06").dayOfYear(),
	moment("2015-06-07").dayOfYear(),
	moment("2015-06-13").dayOfYear(),
	moment("2015-06-14").dayOfYear(),
	moment("2015-06-20").dayOfYear(),
	moment("2015-06-21").dayOfYear(),
	moment("2015-06-22").dayOfYear(),
	moment("2015-06-27").dayOfYear(),
	moment("2015-06-28").dayOfYear(),
	moment("2015-07-04").dayOfYear(),
	moment("2015-07-05").dayOfYear(),
	moment("2015-07-11").dayOfYear(),
	moment("2015-07-12").dayOfYear(),
	moment("2015-07-18").dayOfYear(),
	moment("2015-07-19").dayOfYear(),
	moment("2015-07-25").dayOfYear(),
	moment("2015-07-26").dayOfYear(),
	moment("2015-08-01").dayOfYear(),
	moment("2015-08-02").dayOfYear(),
	moment("2015-08-08").dayOfYear(),
	moment("2015-08-09").dayOfYear(),
	moment("2015-08-15").dayOfYear(),
	moment("2015-08-16").dayOfYear(),
	moment("2015-08-22").dayOfYear(),
	moment("2015-08-23").dayOfYear(),
	moment("2015-08-29").dayOfYear(),
	moment("2015-08-30").dayOfYear(),
	moment("2015-09-05").dayOfYear(),
	moment("2015-09-06").dayOfYear(),
	moment("2015-09-12").dayOfYear(),
	moment("2015-09-13").dayOfYear(),
	moment("2015-09-19").dayOfYear(),
	moment("2015-09-20").dayOfYear(),
	moment("2015-09-26").dayOfYear(),
	moment("2015-09-27").dayOfYear(),
	moment("2015-10-01").dayOfYear(),
	moment("2015-10-02").dayOfYear(),
	moment("2015-10-03").dayOfYear(),
	moment("2015-10-04").dayOfYear(),
	moment("2015-10-05").dayOfYear(),
	moment("2015-10-06").dayOfYear(),
	moment("2015-10-07").dayOfYear(),
	moment("2015-10-10").dayOfYear(),
	moment("2015-10-11").dayOfYear(),
	moment("2015-10-17").dayOfYear(),
	moment("2015-10-18").dayOfYear(),
	moment("2015-10-24").dayOfYear(),
	moment("2015-10-25").dayOfYear(),
	moment("2015-10-31").dayOfYear(),
	moment("2015-11-01").dayOfYear(),
	moment("2015-11-07").dayOfYear(),
	moment("2015-11-08").dayOfYear(),
	moment("2015-11-14").dayOfYear(),
	moment("2015-11-15").dayOfYear(),
	moment("2015-11-21").dayOfYear(),
	moment("2015-11-22").dayOfYear(),
	moment("2015-11-28").dayOfYear(),
	moment("2015-11-29").dayOfYear(),
	moment("2015-12-05").dayOfYear(),
	moment("2015-12-06").dayOfYear(),
	moment("2015-12-12").dayOfYear(),
	moment("2015-12-13").dayOfYear(),
	moment("2015-12-19").dayOfYear(),
	moment("2015-12-20").dayOfYear(),
	moment("2015-12-26").dayOfYear(),
	moment("2015-12-27").dayOfYear(),
]

console.log(holiday);

var workingDay = moment().startOf('day').dayOfYear(75).format("YYYYMMDDHHmmSSS");
console.log(workingDay);

function getStartDay() {
	var startDay = moment().startOf('day');
	console.log(moment().hour());
	console.log(moment().minute());
	if (moment().hour() > 14 || (moment().hour() == 14 && moment().minute() >= 30)) {
		console.log('today end');
		startDay = moment().endOf('day').add(1, 'ms');
	}

	/*
	var dayOfYear = startDay.dayOfYear();
	console.log(dayOfYear);
	var theday = holiday.indexOf(185);
	console.log(theday);
	*/
	while (true) {
		var dayOfYear = startDay.dayOfYear();
		if (holiday.indexOf(dayOfYear) === -1) {
			break;
		}
		startDay = startDay.add(1, 'day');
	}
	return startDay;
	//var tomorrow = moment().endOf('day').add(1, 'ms').format("YYYYMMDDHHmmSSS");
	//console.log(today);
}

function getEndDay(startDay, days) {
	--days;
	var endDay = startDay.clone();
	while (days) {
		endDay = endDay.add(1, 'day');
		if (holiday.indexOf(endDay.dayOfYear()) !== -1) continue;
		--days;
	}
	endDay.hour(14);
	endDay.minute(54);
	endDay.second(59);
	return endDay;
}

var startDay = getStartDay();
var endDay = getEndDay(startDay, 5);

console.log(startDay.format("YYYYMMDDHHmmSSS"));
console.log(endDay.format("YYYYMMDDHHmmSSS"));

var today = Date.now();
var otherDay = Date.parse('1981-08-04');

var result = today < otherDay;
console.log(result);

var anum = '0003';
console.log(Number(anum));

var intVal = 13439695920;
var password = intVal.toString().substr(5);
console.log(password);

