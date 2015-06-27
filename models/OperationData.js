var mongoose = require('mongoose');

var operationDataSchema = mongoose.Schema({
    balance: { type:Number, default:0 },
    deposit: { type:Number, default:0 },
    availableInvest: { type:Number, default:0 },
    occupiedInvest: { type:Number, default:0 },
    serviceFeeNotGet: { type:Number, default:0 },
    rechargeToInvest: { type:Number, default:0 },
    investToBalance: { type:Number, default:0 },
    investProfit: { type:Number, default:0 },
    recharge: { type:Number, default:0 },
    withdraw: { type:Number, default:0 },
    commission: { type:Number, default:0 },
    commissionToBalace: { type:Number, default:0 },
    platformInvest: { type:Number, default:0 },
    freezeWithdraw: { type:Number, default:0 },
    createdAt: {type:Date, default: Date.now}
});

var OperationData = mongoose.model('OperationData', operationDataSchema);

module.exports = OperationData;
