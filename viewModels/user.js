var _ = require('lodash');

var privateProperties = [
    'password',
    'resetPasswordToken',
    'resetPasswordExpires'
];

function getUserViewModel(user, orders){
    var realUser = user._doc;
    var vm = _.omit(realUser, privateProperties);
    return _.extend(vm, {
        orders: orders.map(function(order){
            return {
                date: order.createdAt,
                status: order.status ? '交易成功' : '处理中',
                dealType: order.dealType,
                amount: order.amount,
                description: order.description
            };
        })
    });
}

module.exports = getUserViewModel;

