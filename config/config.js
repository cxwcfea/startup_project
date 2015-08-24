var path = require('path'),
    rootPath = path.normalize(__dirname + '/../');

module.exports = {
    development: {
        rootPath: rootPath,
        db: 'mongodb://goldenbull:JDYWNeDM64G9d1aPJ4TeXxOlOK7cbZbjrbNgkyGwwtg@localhost/goldenbull',
        //db: 'mongodb://localhost/goldenbull',
        port: process.env.PORT || 3000,
        pay_callback_domain: 'http://test2.niujinwang.com',
        ppj_callback_domain: 'http://test2.niujinwang.com',
        wechatAppId: 'wxc68d861f37a6f4ca',
        wechatSecret: '91bfa82c41555da23f03fc7fc049f0b1',
        futureIF: 'IF1509',
        serviceCharge: 19.9,
        warnFactor: 0.4,
        sellFactor: 0.6,
        depositFactor: 0.1
    },
    production: {
        rootPath: rootPath,
        db: 'mongodb://goldenbull:JDYWNeDM64G9d1aPJ4TeXxOlOK7cbZbjrbNgkyGwwtg@localhost/goldenbull',
        //db: 'mongodb://localhost/goldenbull',
        port: process.env.PORT || 8888,
        pay_callback_domain: 'http://www.niujinwang.com',
        ppj_callback_domain: 'http://www.niujin.cn',
        wechatAppId: 'wx93316d2e330a4d21',
        wechatSecret: '2fc6cd4d6bb198ece969664509562e02',
        futureIF: 'IF1509',
        investor: '851710073',
        password: '283715',
        front_addr: 'tcp://27.115.57.130:41205/9000',
        serviceCharge: 19.9,
        warnFactor: 0.4,
        sellFactor: 0.6,
        depositFactor: 0.1
    }
};
