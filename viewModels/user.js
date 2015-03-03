var _ = require('lodash');

var privateProperties = [
    'password',
    'resetPasswordToken',
    'resetPasswordExpires'
];

function getUserViewModel(user, orders){
    user.profile.picture = user.gravatar();
    var realUser = user._doc;
    var vm = _.omit(realUser, privateProperties);
    return _.extend(vm, {
        orders: orders.map(function(order){
            return {
                date: order.createdAt,
                status: order.status ? '交易成功' : '交易失败',
                dealType: order.dealType,
                amount: order.amount,
                description: order.description
            };
        })
    });
}

module.exports = getUserViewModel;

