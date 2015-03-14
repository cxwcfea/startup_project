var User = require('../models/User'),
    Apply = require('../models/Apply'),
    Order = require('../models/Order'),
    log4js = require('log4js'),
    logger = log4js.getLogger('admin'),
    util = require('../lib/util'),
    sms = require('../lib/sms');

function main(req, res, next) {
    res.render('admin/main', {layout:null});
}

function fetchUserList(req, res, next) {
    User.find({}, function(err, collection) {
        if (err) {
            return res.send({success:false, reason:err.toString()});
        }
        res.send(collection);
    });
}

function sendSMS(req, res, next) {
    var data = req.body;
    sms.sendSMS(data.user_mobile, '', data.sms_content, function (result) {
        if (result.error) {
            return res.send({success:false, reason:result.msg});
        } else {
            res.send({success:true});
        }
    });
}

function fetchAppliesForUser(req, res, next) {
    logger.debug(req.params.uid);
    Apply.find({userID:req.params.uid}, function(err, collection) {
        if (err) {
            logger.error(err.toString());
        }
        res.send(collection);
    });
}

function updateApplyForUser(req, res, next) {
    var data = req.body;
    Apply.findById(req.params.id, function(err, apply) {
        if(err) {
            logger.error(err.toString());
            res.status(500);
            return res.send({success:false, reason:err.toString()});
        }
        if(!apply) {
            logger.error(err.toString());
            res.status(400);
            return res.send({success:false, reason:err.toString()});
        }
        apply.account = data.account;
        apply.password = data.password;
        apply.status = data.status;
        apply.save(function(err) {
            if(err) {
                logger.error(err.toString());
                res.status(500);
                return res.send({success:false, reason:err.toString()});
            }
            return res.send(apply);
        });
    });
}

function updateOrderForUser(req, res) {
    if (req.body._id) {
        Order.update({_id:req.body._id}, req.body, function(err, numberAffected, raw) {
            if(err) {
                logger.warn('error when update order by admin:', err.toString());
                res.status(500);
                return res.send({reason:err.toString()});
            }
            res.send(req.body);
        });
    } else {
        res.send({});
    }
}

function fetchOrdersForUser(req, res) {
    logger.debug(req.params.uid);
    Order.find({userID:req.params.uid}, function(err, order) {
        if (err) {
            logger.error(err.toString());
            res.status(500);
            return res.send({success:false, reason:err.toString()});
        }
        res.send(order);
    });
}

function fetchNearExpireApplies(req, res) {
    var startTime = util.getStartDay();
    var endTime = util.getEndDay(startTime, 1);

    Apply.find({ $and: [{ endTime: {$lt: endTime } }, {status: 2}] }, function(err, applies) {
        if (err) {
            logger.warn(err.toString());
            return res.send({success:false, reason:err.toString()});
        }
        res.send(applies);
    });
}

function updateUser(req, res) {
    if (req.body._id) {
        User.update({_id:req.body._id}, req.body, function(err, numberAffected, raw) {
            if(err) {
                logger.warn('error when update user by admin:', err.toString());
                res.status(500);
                return res.send({reason:err.toString()});
            }
            res.send(req.body);
        });
    } else {
        res.send({});
    }
}

function getUser(req, res) {
    User.findById(req.params.id, function(err, user){
        if (err) {
            logger.warn('error when get user:', err.toString());
            res.status(500);
            return res.send({reason:err.toString()});
        }
        res.send(user);
    });
}

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/admin', passportConf.requiresRole('admin'), main);

        app.get('/admin/api/users', passportConf.requiresRole('admin'), fetchUserList);

        app.post('/admin/api/send_sms', passportConf.requiresRole('admin'), sendSMS);

        app.get('/admin/api/user/:uid/applies', passportConf.requiresRole('admin'), fetchAppliesForUser);

        app.post('/admin/api/user/:uid/applies/:id', passportConf.requiresRole('admin'), updateApplyForUser);

        app.get('/admin/api/user/:uid/orders', passportConf.requiresRole('admin'), fetchOrdersForUser);

        app.post('/admin/api/user/:uid/orders/:id', passportConf.requiresRole('admin'), updateOrderForUser);

        app.get('/admin/api/applies/expire', passportConf.requiresRole('admin'), fetchNearExpireApplies);

        app.post('/admin/api/users/:id', passportConf.requiresRole('admin'), updateUser);

        app.get('/admin/api/users/:id', passportConf.requiresRole('admin'), getUser);

        app.get('/admin/*', passportConf.requiresRole('admin'), function(req, res, next) {
            res.render('admin/' + req.params[0], {layout:null});
        });
    }
};
