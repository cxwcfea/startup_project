var User = require('../models/User'),
    Apply = require('../models/Apply'),
    log4js = require('log4js'),
    logger = log4js.getLogger('admin'),
    sms = require('../lib/sms');

module.exports = {
    registerRoutes: function(app, passportConf) {
        app.get('/admin', passportConf.requiresRole('admin'), this.main);

        app.get('/admin/api/users', passportConf.requiresRole('admin'), this.fetchUserList);

        app.post('/admin/api/send_sms', passportConf.requiresRole('admin'), this.sendSMS);

        app.get('/admin/api/user/:uid/applies', passportConf.requiresRole('admin'), this.fetchAppliesForUser);

        app.post('/admin/api/user/:uid/applies/:id', passportConf.requiresRole('admin'), this.updateApplyForUser);

        app.get('/admin/*', passportConf.requiresRole('admin'), function(req, res, next) {
            res.render('admin/' + req.params[0], {layout:null});
        });
        /*
        app.get('/customer/:id', this.home);
        app.get('/customer/:id/preferences', this.preferences);
        app.get('/orders/:id', this.orders);

        app.post('/customer/:id/update', this.ajaxUpdate);
        */
    },

    main: function(req, res, next) {
        res.render('admin/main', {layout:null});
    },

    fetchUserList: function(req, res, next) {
        User.find({}, function(err, collection) {
            if (err) {
                return res.send({success:false, reason:err.toString()});
            }
            res.send(collection);
        });
    },

    sendSMS: function(req, res, next) {
        var data = req.body;
        sms.sendSMS(data.user_mobile, '', data.sms_content, function (result) {
            if (result.error) {
                return res.send({success:false, reason:result.msg});
            } else {
                res.send({success:true});
            }
        });
    },

    fetchAppliesForUser: function(req, res, next) {
        logger.debug(req.params.uid);
        Apply.find({userID:req.params.uid}, function(err, collection) {
            if (err) {
                logger.error(err.toString());
            }
            res.send(collection);
        });
    },

    updateApplyForUser: function(req, res, next) {
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

    /*
    register: function(req, res, next) {
        res.render('customer/register');
    },

    processRegister: function(req, res, next) {
        // TODO: back-end validation (safety)
        var c = new Customer({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            address1: req.body.address1,
            address2: req.body.address2,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            phone: req.body.phone,
        });
        c.save(function(err) {
            if(err) return next(err);
            res.redirect(303, '/customer/' + c._id);
        });
    },

    home: function(req, res, next) {
        Customer.findById(req.params.id, function(err, customer) {
            if(err) return next(err);
            if(!customer) return next(); 	// pass this on to 404 handler
            customer.getOrders(function(err, orders) {
                if(err) return next(err);
                res.render('customer/home', customerViewModel(customer, orders));
            });
        });
    },

    preferences: function(req, res, next) {
        Customer.findById(req.params.id, function(err, customer) {
            if(err) return next(err);
            if(!customer) return next(); 	// pass this on to 404 handler
            customer.getOrders(function(err, orders) {
                if(err) return next(err);
                res.render('customer/preferences', customerViewModel(customer, orders));
            });
        });
    },

    orders: function(req, res, next) {
        Customer.findById(req.params.id, function(err, customer) {
            if(err) return next(err);
            if(!customer) return next(); 	// pass this on to 404 handler
            customer.getOrders(function(err, orders) {
                if(err) return next(err);
                res.render('customer/preferences', customerViewModel(customer, orders));
            });
        });
    },

    ajaxUpdate: function(req, res) {
        Customer.findById(req.params.id, function(err, customer) {
            if(err) return next(err);
            if(!customer) return next(); 	// pass this on to 404 handler
            if(req.body.firstName){
                if(typeof req.body.firstName !== 'string' ||
                    req.body.firstName.trim() === '')
                    return res.json({ error: 'Invalid name.'});
                customer.firstName = req.body.firstName;
            }
            // and so on....
            customer.save(function(err) {
                return err ? res.json({ error: 'Unable to update customer.' }) : res.json({ success: true });
            });
        });
    }
    */
};
