var path = require('path'),
    rootPath = path.normalize(__dirname + '/../');

module.exports = {
    development: {
        rootPath: rootPath,
        db: 'mongodb://goldenbull:JDYWNeDM64G9d1aPJ4TeXxOlOK7cbZbjrbNgkyGwwtg@localhost/goldenbull',
        port: process.env.PORT || 3000,
        pay_callback_domain: 'http://test.niujinwang.com',
        serviceCharge: 18.8,
        warnFactor: 0.93,
        sellFactor: 0.95
    },
    production: {
        rootPath: rootPath,
        db: 'mongodb://cxwcfea:goldenbull@ds063240.mongolab.com:63240/goldenbull',
        port: process.env.PORT || 80,
        pay_callback_domain: 'http://www.niujinwang.com',
        serviceCharge: 19.8,
        warnFactor: 0.93,
        sellFactor: 0.95
    }
};
