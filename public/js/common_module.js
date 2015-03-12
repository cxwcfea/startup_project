(function() {
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
        if (moment().hour() > 14 || (moment().hour() == 14 && moment().minute() >= 30)) {
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

    var getEndDay = function(startDay, days) {
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
    };

    angular.module('commonApp', []);

    angular.module('commonApp').value('gbToastr', toastr);

    angular.module('commonApp').factory('gbNotifier', ['gbToastr', function(gbToastr) {
        return {
            notify: function(msg) {
                gbToastr.success(msg);
                //console.log(msg);
            },
            error: function(msg) {
                gbToastr.error(msg);
                //console.log(msg);
            }
        }
    }]);

    angular.module('commonApp').filter("displayDate", function () {
        return function (input) {
            return moment(input).format("YYYY-MM-DD HH:mm");
        };
    }).filter("orderStatus", function() {
        return function (input) {
            if (input) {
                return '交易成功';
            } else {
                return '等待确认';
            }
        };
    }).service("days", function () {
        this.startTime = getStartDay;
        this.endTime = getEndDay;
    });
}());
