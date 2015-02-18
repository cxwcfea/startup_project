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
