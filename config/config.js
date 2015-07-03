var path = require('path'),
    rootPath = path.normalize(__dirname + '/../');

module.exports = {
    development: {
        rootPath: rootPath,
        db: 'mongodb://goldenbull:JDYWNeDM64G9d1aPJ4TeXxOlOK7cbZbjrbNgkyGwwtg@localhost/goldenbull',
        //db: 'mongodb://localhost/goldenbull',
        port: process.env.PORT || 3000,
        pay_callback_domain: 'http://server2.niujinwang.com',
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
        serviceCharge: 19.9,
        warnFactor: 0.4,
        sellFactor: 0.6,
        depositFactor: 0.1
    }
};
