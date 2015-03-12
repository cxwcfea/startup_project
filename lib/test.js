var util = require('./util');

var theday = util.getStartDay();
var day = theday.toDate();
var endday = util.getEndDay(theday, 6).toDate();

console.log(day);
console.log(endday);
