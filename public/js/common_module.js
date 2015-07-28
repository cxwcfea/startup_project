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
        moment("2015-05-30").dayOfYear(),
        moment("2015-05-31").dayOfYear(),
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
        if (moment().hour() >= 14) {
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

    var getEndDay = function(startDay, period, type) {
        var endDay = startDay.clone();
        if (type && type === 2) {
            endDay = endDay.add(period, 'months');
            while (holiday.indexOf(endDay.dayOfYear()) !== -1) {
                endDay = endDay.add(1, 'day');
            }
            return endDay;
        }
        --period;
        while (period) {
            endDay = endDay.add(1, 'day');
            if (holiday.indexOf(endDay.dayOfYear()) !== -1) continue;
            --period;
        }
        endDay.hour(14);
        endDay.minute(50);
        endDay.second(00);
        return endDay;
    };

    var tradeDaysTillNow  = function(startDay, days) {
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

    angular.module('commonApp').filter("numTrunc", function () {
        return function (input) {
            if (input) {
                var ret = input.toString();
                var pos = ret.search('\\.');
                if (pos > -1) {
                    ret = ret.substr(pos);
                }
            }
            return ret;
        };
    }).filter("integerNum", function () {
        return function (input) {
            var ret = input;
            var pos = ret.search('\\.');
            if (pos > -1) {
                ret = ret.substr(0, pos);
            }
            return ret;
        };
    }).filter("displayManager", function () {
        return function (input) {
            switch (input) {
                case '13520978346':
                    return '秦亚景';
                case '13488867185':
                    return '姜涛';
                case '17709810065':
                    return '刘恩泽';
                case '18911347741':
                    return '刘瑞';
                case '18511565878':
                    return '刘亚东';
                case '15101183931':
                    return '孟雪';
                case '18931040286':
                    return '魏昊庚';
                case '15710035052':
                    return '张丽霞';
                default:
                    return input;
            }
        };
    }).filter("displayOrderAmount", function () {
        return function (input, orderType) {
            var ret = '+';
            if (orderType === 2 || orderType === 9 || orderType === 10 || orderType === 11 || orderType === 17 || orderType === 15 || orderType === 19 || orderType === 7) {
                ret = '-';
            }
            return ret + input;
        };
    }).filter("displayIncome", ['$filter', function ($filter) {
        return function (input, orderType) {
            var ret = input;
            if (orderType == 2 || orderType == 9 || orderType == 10 || orderType === 11 || orderType === 17 || orderType == 15 || orderType == 19 || orderType === 7) {
                return '';
            }
            return $filter('currency')(ret, '', 2);
        };
    }]).filter("displayOutcome", ['$filter', function ($filter) {
        return function (input, orderType) {
            var ret = '';
            if (orderType == 2 || orderType == 9 || orderType == 10 || orderType === 11 || orderType === 17 || orderType == 15 || orderType == 19 || orderType === 7) {
                ret = $filter('currency')(input, '', 2);
            }
            return ret;
        };
    }]).filter("displayMobile", function () {
        return function (input) {
            if (input) {
                input = input.toString();
                return input.substr(0, 3) + "****" + input.substr(-4);
            }
            return '';
        };
    }).filter("displayEmail", function () {
        return function (input) {
            if (input) {
                var pos = input.search('@');
                return input.substr(0, 2) + "***" + input.substr(pos);
            } else {
                return '';
            }
        };
    }).filter("displayIdentityID", function () {
        return function (input) {
            if (input) {
                return input.substr(0, 4) + "**********" + input.substr(-4);
            } else {
                return '';
            }
        };
    }).filter("displayDate", function () {
        return function (input) {
            if (!input) {
                return 'N/A';
            }
            return moment(input).format("YYYY-MM-DD HH:mm");
        };
    }).filter("displayShortDate", function () {
        return function (input) {
            return moment(input).format("YYYY-MM-DD");
        };
    }).filter("displayCard", ['BankNameList', function (BankNameList) {
        return function (input) {
            if (input && input.cardID) {
                var lastNumStr = input.cardID.toString().substr(12);
                return BankNameList[input.bankID].name + ' **** **** **** ' + lastNumStr;
            }
            return '';
        };
    }]).filter("displayCard3", function () {
        return function (input) {
            if (input && input.cardID) {
                var lastNumStr = input.cardID.toString().substr(-4);
                var firstNumStr = input.cardID.toString().substr(0, 4);
                return firstNumStr + ' **** **** ' + lastNumStr;
            }
            return '';
        };
    }).filter("displayCard2", ['BankNameList', function (BankNameList) {
        return function (input) {
            if (input && input.cardID) {
                var last4NumStr = input.cardID.toString().substr(-4);
                return last4NumStr;
            }
            return '';
        };
    }]).filter("orderStatus", function() {
        return function (input) {
            switch (input) {
                case 0:
                    return '等待确认';
                case 1:
                    return '交易成功';
                case 2:
                    return '未支付';
                default:
                    return '未支付';
            }
        };
    }).filter("contractStatus", function() {
        return function (input) {
            switch (input) {
                case 1:
                    return '进行中';
                case 2:
                    return '已回款';
                default:
                    return '未知';
            }
        };
    }).filter("displayOrderType", function() {
        return function (input) {
            switch (input) {
                case 1:
                    return '充值';
                case 2:
                    return '提现';
                case 3:
                    return '盈利提取';
                case 4:
                    return '股票盈利';
                case 5:
                    return '保证金返还';
                case 6:
                    return '保证金支出';
                case 7:
                    return '管理费支出';
                case 8:
                    return '管理费返还';
                case 9:
                    return '保证金支出';
                case 10:
                    return '管理费支出';
                case 11:
                    return '投资本金支出';
                case 12:
                    return '利息收入';
                case 13:
                    return '推广佣金';
                case 14:
                    return '佣金兑换余额';
                case 15:
                    return '穿仓扣除';
                case 16:
                    return '投资本金返还';
                case 17:
                    return '余额转入投资本金';
                case 18:
                    return '投资本金转入余额';
                case 19:
                    return '融资加配';
                default:
                    return '充值';
            }
        };
    }).filter("applyStatus", function() {
        return function(input) {
            switch (input) {
                case 1:
                    return "待支付";
                case 2:
                    return "操盘中";
                case 3:
                    return "已结算";
                case 4:
                    return "审核中";
                case 5:
                    return "结算中";
                case 9:
                    return "排队中";
                default:
                    return "待支付";
            }
        };
    }).filter("payType", function() {
        return function(input) {
            switch (input) {
                case 0:
                    return "爱贝";
                case 1:
                    return "盛付通";
                case 2:
                    return "股票融资盈利";
                case 3:
                    return "支付宝";
                case 4:
                    return "银行转账";
                case 5:
                    return "贝付移动";
                case 6:
                    return "佣金";
                case 7:
                    return "牛金";
                case 8:
                    return "穿仓";
                case 9:
                    return "易宝";
                default:
                    return "无";
            }
        };
    }).filter("displayAccountType", function() {
        return function(input) {
            switch (input) {
                case 2:
                    return "同花顺";
                case 3:
                    return "牛金操盘";
                default:
                    return "Homs";
            }
        };
    }).filter("displayFutureQuantity", function() {
        return function(input) {
            if (!angular.isNumber(input)) {
                return input;
            } else {
                var ret = '';
                if (input > 0) {
                    ret += '涨';
                } else {
                    ret += '跌'
                }
                input /= 100;
                input = Math.abs(input);
                ret += input;
                return ret;
            }
        };
    }).service("days", function () {
        this.startTime = getStartDay;
        this.endTime = getEndDay;
        this.tradeDaysTillNow = tradeDaysTillNow;
    }).service("util", ['warn_factor', 'sell_factor', function (warn_factor, sell_factor) {
        this.serviceCharge = 19.9;
        this.getServiceCharge = function(lever) {
            switch (lever) {
                case 10:
                    return 19.9;
                case 9:
                    return 18.9;
                case 8:
                    return 29.9;
                case 7:
                    return 28.9;
                case 6:
                    return 27.9;
                case 5:
                    return 14.9;
                case 4:
                    return 13.9;
                case 3:
                    return 10.9;
                case 2:
                    return 9.9;
                default:
                    return 19.9;
            }
        };
        this.getServiceFee = function(apply, period, notCountFreeDays) {
            var discount = apply.discount ? apply.discount : 1;
            if (discount <= 0 || discount > 1) {
                discount = 1;
            }
            if (apply.type && apply.type === 2) {
                return Number((apply.amount * apply.interestRate * discount).toFixed(2));
            }
            if (!period) {
                period = apply.period;
            }
            var freeDays = 0;
            if (!notCountFreeDays) {
                freeDays = (apply.freeDays > 0) ? apply.freeDays : 0;
                period -= freeDays;
                if (period < 0) {
                    period = 0;
                }
            }
            return Number((apply.amount / 10000 * (apply.serviceCharge ? apply.serviceCharge : this.getServiceCharge(apply.lever)) * period * discount).toFixed(2));
        };
        this.getWarnValue = function(amount, deposit) {
            return Number((amount - warn_factor * deposit).toFixed(2));
        };
        this.getSellValue = function(amount, deposit) {
            return Number((amount - sell_factor * deposit).toFixed(2));
        }
    }]);

    var sms_macro = [
        {
            name: 'register_content',
            value: 0,
            content: '验证码：CODE，用于注册，欢迎来到牛金网，为您提供专业贴心的融资服务。'
        },
        {
            name: 'reset_pass_content',
            value: 1,
            content: '验证码：CODE，用于密码重置，请勿泄露给他人！'
        },
        {
            name: 'approve_apply_sms_content',
            value: 2,
            content: 'AMOUNT元资金已到账，股票账号ACCOUNT，登录密码PASSWORD，请不要向任何人泄露！'
        },
        {
            name: 'close_apply_sms_content',
            value: 3,
            content: '账户ACCOUNT结算AMOUNT元（保证金DEPOSIT元，收益PROFIT元）已完成，祝您投资愉快。'
        },
        {
            name: 'pay_success_sms_content',
            value: 4,
            content: '充值AMOUNT元成功，请登录查看详情，祝您投资愉快。'
        },
        {
            name: 'warn_sms_content',
            value: 5,
            content: '您的账户（XXXXXXXX）的操盘业务已经亏损到达警戒线，请尽快追加至少XXXX元保证金以维持仓位。'
        },
        {
            name: 'sell_sms_content',
            value: 6,
            content: '账户12345678已经亏损到达平仓线，系统已将其平仓，如需帮助请致电4006921388。'
        },
        {
            name: 'withdraw_content',
            value: 7,
            content: '提现AMOUNT元已完成，请注意查收，如有疑问请致电4006921388。'
        }
    ];

    angular.module('commonApp').constant('withdraw_sms_content', '您于TIME在牛金网提现AMOUNT元，提现已完成，请注意查收，')
        .constant('get_profit_sms_content', '您的盈利提取申请已经处理，资金已划入您在牛金网的余额')
        .constant('approve_apply_sms_content', '您有一笔金额为AMOUNT元融资资金已到账，交易账号ACCOUNT，登录密码PASSWORD，您可以通过手机或电脑进行操盘，可以登录牛金网，在我的账户中查看相应账户信息，操盘账户是您操盘的唯一依据，请不要向任何人泄露！')
        .constant('close_apply_sms_content', '您在牛金网有一笔TOTAL_AMOUNT元的融资业务已经结算完毕，根据您的操盘收益，该笔融资实际结算AMOUNT元（保证金DEPOSIT元，收益PROFIT元），祝您投资愉快。')
        .constant('pay_success_sms_content', '您于TIME在牛金网充值AMOUNT元，资金已经到账，感谢您对牛金网的支持，祝您投资愉快。')
        .constant('warn_sms_content', '您有一笔金额为TOTAL_AMOUNT元的操盘业务已经亏损到达警戒线WARN_AMOUNT元，请尽快追加保证金以维持仓位，您可以登录牛金网进行操作，或者联系QQ客服400 692 1388或电话客服400 692 1388。感谢您对牛金网的支持，祝您投资愉快。')
        .constant('sell_sms_content', '您有一笔金额为TOTAL_AMOUNT元的操盘业务已经亏损到达平仓线SELL_AMOUNT元，系统已经将交易账户平仓，请登录牛金网查看相应信息，或者联系QQ客服400 692 1388或电话客服400 692 1388。感谢您对牛金网的支持，祝您投资愉快。')
        .constant('sms_macro', sms_macro)
        .constant('service_charge', 19.9)
        .constant('warn_factor', 0.4)
        .constant('sell_factor', 0.6);

    angular.module('commonApp').constant('BankNameList', [
        {
            name: '工商银行',
            img: '/images/yh/icbc.jpg',
            logo: '/mobile/images/yh/icbc_logo.jpg',
            instCode: 'ICBC',
            credit: true,
            value: 0
        },
        {
            name: '建设银行',
            img: '/images/yh/cbc.jpg',
            logo: '/mobile/images/yh/cbc_logo.jpg',
            instCode: 'CCB',
            credit: true,
            value: 1
        },
        {
            name: '农业银行',
            img: '/images/yh/abc.jpg',
            logo: '/mobile/images/yh/abc_logo.jpg',
            instCode: 'ABC',
            credit: true,
            value: 2
        },
        {
            name: '中国银行',
            img: '/images/yh/boc.png',
            logo: '/mobile/images/yh/boc_logo.jpg',
            instCode: 'BOC',
            credit: true,
            value: 3
        },
        {
            name: '招商银行',
            img: '/images/yh/cmb.jpg',
            logo: '/mobile/images/yh/cmb_logo.jpg',
            instCode: 'CMB',
            credit: true,
            value: 4
        },
        {
            name: '交通银行',
            img: '/images/yh/bcs.png',
            logo: '/mobile/images/yh/bcs_logo.jpg',
            instCode: 'COMM',
            credit: true,
            value: 5
        },
        {
            name: '邮政储蓄银行',
            img: '/images/yh/psbc.png',
            logo: '/mobile/images/yh/psbc_logo.jpg',
            instCode: 'PSBC',
            credit: false,
            value: 6
        },
        {
            name: '广发银行',
            img: '/images/yh/cgb.png',
            logo: '/mobile/images/yh/cgb_logo.jpg',
            instCode: 'GDB',
            credit: true,
            value: 7
        },
        {
            name: '光大银行',
            img: '/images/yh/ceb.png',
            logo: '/mobile/images/yh/ceb_logo.jpg',
            instCode: 'CEB',
            credit: true,
            value: 8
        },
        {
            name: '兴业银行',
            img: '/images/yh/cib.png',
            logo: '/mobile/images/yh/cib_logo.jpg',
            instCode: 'CIB',
            credit: true,
            value: 9
        },
        {
            name: '北京银行',
            img: '/images/yh/bob.png',
            logo: '/mobile/images/yh/bob_logo.jpg',
            instCode: 'BCCB',
            credit: false,
            value: 10
        },
        {
            name: '浦发银行',
            img: '/images/yh/spdb.png',
            logo: '/mobile/images/yh/spdb_logo.jpg',
            instCode: 'SPDB',
            credit: true,
            value: 11
        },
        {
            name: '民生银行',
            img: '/images/yh/cmbc.png',
            logo: '/mobile/images/yh/cmbc_logo.jpg',
            instCode: 'CMBC',
            credit: true,
            value: 12
        },
        {
            name: '中信银行',
            img: '/images/yh/ecitic.png',
            logo: '/mobile/images/yh/ecitic_logo.jpg',
            instCode: 'CITIC',
            credit: true,
            value: 13
        },
        {
            name: '华夏银行',
            img: '/images/yh/hx-2.png',
            logo: '/mobile/images/yh/hx_logo.jpg',
            instCode: 'HXB',
            credit: false,
            value: 14
        },
        {
            name: '平安银行',
            img: '/images/yh/pa.png',
            logo: '/mobile/images/yh/pa_logo.jpg',
            instCode: 'SZPAB',
            credit: true,
            value: 15
        },
        {
            name: '宁波银行',
            img: '/images/yh/nbcb.png',
            logo: '/mobile/images/yh/nbcb_logo.jpg',
            instCode: 'NBCB',
            credit: false,
            value: 16
        },
        {
            name: '上海银行',
            img: '/images/yh/bos.png',
            logo: '/mobile/images/yh/bos_logo.jpg',
            instCode: 'BOS',
            credit: true,
            value: 17
        },
        /*
         {
         name: '杭州银行',
         img: '/images/yh/hzyh.png',
         value: 16
         }
         */
    ]);

    angular.module('commonApp').factory('njUser', ['$resource', function($resource) {
        var UserResource = $resource('/api/user/:id', {id: "@_id"});

        return UserResource;
    }]);

    angular.module('commonApp').factory('njApply', ['$resource', function($resource) {
        var ApplyResource = $resource('/api/user/:uid/applies/:serial_id', {uid: "@userID", serial_id: "@serialID"});

        return ApplyResource;
    }]);

    angular.module('commonApp').factory('njOrder', ['$resource', function($resource) {
        var OrderResource = $resource('/api/user/:uid/orders/:id', {uid: "@userID", id: "@_id"});

        return OrderResource;
    }]);

    angular.module('commonApp').factory('njCard', ['$resource', function($resource) {
        var CardResource = $resource('/api/cards/:uid', {userID: "@uid"});

        return CardResource;
    }]);

    angular.module('commonApp').factory('njCachedCards', ['njCard', function(njCard) {
        var cardList;
        var uid;

        return {
            setUID: function(id) {
                uid = id;
            },

            query: function() {
                if(!cardList) {
                    cardList = njCard.query({uid:uid});
                }
                return cardList;
            }
        }
    }]);
}());
