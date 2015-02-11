var path = require('path'),
    rootPath = path.normalize(__dirname + '/../');

module.exports = {
    development: {
        rootPath: rootPath,
        db: 'mongodb://localhost/goldenbull',
        port: process.env.PORT || 3000
    },
    production: {
        rootPath: rootPath,
        db: 'mongodb://cxwcfea:goldenbull@ds063240.mongolab.com:63240/goldenbull',
        port: process.env.PORT || 80
    }
}
