var moment = require('moment');

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
    moment("2015-12-27").dayOfYear()
];

var getStartDay = function() {
    var startDay = moment().startOf('day');
	console.log(moment().hour());
    if (moment().hour() >= 15) {
        startDay = moment().endOf('day').add(1, 'ms');
    }

    while (true) {
        var dayOfYear = startDay.dayOfYear();
        if (holiday.indexOf(dayOfYear) === -1) {
            break;
        }
        startDay = startDay.add(1, 'day');
    }
    return startDay;
};

console.log(getStartDay().format('YYYYMMDDHHmmSSS'));
var today = moment();
var yesterday = moment().subtract(1, 'days');
console.log(yesterday);
console.log(today.toDate());
console.log(yesterday.toDate());
today = today.toDate();
yesterday = yesterday.toDate();

if (today < yesterday) {
	console.log('today < yesterday');
} else if (today > yesterday) {
	console.log('today > yesterday');
} else {
	console.log('today = yesterday');
}

today= moment().format('YYYYMMDD');
console.log(today);
today= moment().toDate();
var beforeOneDay = moment().subtract(15, 'days').startOf('day').toDate();
var beforeTwoDay = moment().subtract(15, 'days').endOf('day').toDate();
console.log(beforeOneDay);
console.log(beforeTwoDay);
console.log(moment("2015-04-28").toDate());

var tradeDaysTillNow = function(startDay) {
    var startDayOfYear = moment(startDay).dayOfYear();
    var currentDayOfYear = moment().dayOfYear();
    var ret = 0;
    while (currentDayOfYear >= startDayOfYear) {
        if (holiday.indexOf(currentDayOfYear) === -1) {
            ++ret;
        }
        --currentDayOfYear;
    }
    return ret;
};

console.log(tradeDaysTillNow(moment("2015-04-16").toDate()));

            var startDay = moment().startOf('day');
            if (moment().hour() >= 14) {
                startDay = moment().endOf('day').add(1, 'ms');
            }
            var endDay = startDay.clone();
            endDay = endDay.add(3, 'days').subtract(1, 'ms');

			console.log(startDay.toDate());
			console.log(endDay.toDate());

			var day1 = moment("2015-05-01").dayOfYear();
			var day2 = moment().dayOfYear();
			console.log(day2 - day1);
