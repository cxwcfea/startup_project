var net = require("net"),
	_ = require('underscore'),
    log4js = require('log4js'),
    logger = log4js.getLogger('hive'),
	bytebuffer = require("ByteBuffer");
var HIVE_USERNAME_LEN = 32,
	HIVE_PASSWORD_LEN = 32,
	HIVE_HOSTADDR_LEN = 128,
	HIVE_SYMBOL_LEN = 32,
	HIVE_REASON_LEN = 128;

var HIVE_MSG_TYPE = { 
	HiveMsgLoginReq : 108, // 'l'
	HiveMsgLoginRsp : 76,  //'L',
	HiveMsgOrder    : 111, // 'o',
	HiveMsgCancel   : 99,  //'c',
	HiveMsgExec     : 120, //'x',
	HiveMsgReason   : 114 //'r';
};
var HIVE_TIF = {
	HiveTifDay     : 'd',
	HiveTifIOC     : 105, //'i',
	HiveTifOnOpen  : 'O',
	HiveTifOnClose : 'C',
	HiveTifGTD     : 'g', // good till date
	HiveTifGTC     : 'G' // good till cancelled
};

var HiveExecType = {
	HiveExecNew       : 'n',
	HiveExecPartial   : 'f',
	HiveExecFill      : 70, //'F',
	HiveExecDone      : 100, //'d',
	HiveExecCancel    : 'c',
	HiveExecCancelRej : 'j',
	HiveExecReplace   : 'p',
	HiveExecReject    : 'r'
};

//var isLogin = false;
function Hive(config) {
	this.ip = config.ip;
	this.port = config.port;
	this.investor = config.investor;
	this.password = config.password;
	this.front_addr = config.front_addr;
	this.client_id = config.client_id;
	this.version = config.version;
	this.interval = config.interval;
	this.socket_client = new net.Socket();
	this.order2user = {};
	this.user2cb = {};
	this.isLogin = false;
    this.login_in_process = false;
}

Hive.prototype.destroy = function() {
    this.socket_client.end();
    this.socket_client.destroy();
};

Hive.prototype.login = function (){
    if(this.login_in_process == true){
        logger.debug('login in process, please wait..');
        return;
    }
    this.login_in_process = true;
	var param = {};
	param.mtype = HIVE_MSG_TYPE.HiveMsgLoginReq;
	// socket_client.setEncoding('binary');
	var that = this;
	var client = this.socket_client;
	client.connect(that.port, that.ip, function(){
		logger.debug('connect to '+ that.ip);
		var sbuf = new bytebuffer().littleEndian();
		var req = sbuf.byte(param.mtype)
						.vstring(that.investor, HIVE_USERNAME_LEN)
						.vstring(that.password, HIVE_PASSWORD_LEN)
						.vstring(that.front_addr, HIVE_HOSTADDR_LEN)
						.uint32(that.client_id)
						.byte(that.version)
						.byte(that.interval)
						.pack();
		client.write(req);
	});
	client.on('data',function(data) {
		if (that.isLogin == false) {
			logger.debug('login recv response ');
			var buff = new bytebuffer(data).littleEndian();
			//FIXME: need to make sure the parsing process 
			//does't exceeds the boundry.
			var arr = buff.byte()
							.byte()
							.uint32()
							.byte()
							.byte()
							.vstring(null, HIVE_REASON_LEN)
							.unpack();
			if (arr[0] == HIVE_MSG_TYPE.HiveMsgLoginRsp && arr[1] == 0) {
                that.isLogin = true;
                that.login_in_process = false;
                logger.debug('login to Hive SUCCESS.');
            }
		} else {
			//console.log('++++++recv order response ');
			var buff = new bytebuffer(data).littleEndian();
			//FIXME: need to make sure the parsing process 
			//does't exceeds the boundry.
			var arr = buff.byte()		//mtype
							.int64()	//oid
							.int64()	//orid
							.byte()		//type
							.byte()		//act
							.float()	//size
							.double()	//px_raw
							.uint32()	//px_int
							.uint32()	//px_bps
							.uint32()	//liq
							.uint32()	//dest
							.int64()	//flag
							.byte()		//has_reason
							.unpack();
			var order_id = arr[1];
			var result = arr[3];
            var traded_price = arr[6];
			var user_id = that.order2user[order_id];
			var callback = that.user2cb[user_id];
			var code = 0;
			if(result != HiveExecType.HiveExecFill) {
				code = -1;
                traded_price = 4030;
            }
            if(callback === undefined)
                return;
			callback(null, {code: code, traded_price: traded_price});
            delete that.order2user[order_id];
            delete that.user2cb[user_id];
		}
	});
	client.on('error',function(error){
        logger.debug('socket error.', error);
	});
	client.on('close',function(){
        logger.debug('Connection closed');
        that.isLogin = false;
	});
};

Hive.prototype.createOrder = function (param, callback){
    //console.log('in createOrder, login ' + this.isLogin);
	if (!this.isLogin) {
        logger.debug('hive not login....start relogin...');
        this.login();
        return callback({code:8, msg:'connecting hive'});
	}
	if (this.user2cb[param.user_id]) {
        logger.debug('previous order in process, abort current one.');
        setTimeout(function(){
            delete user2cb[param.user_id];
        }, 3*1000);
        return callback('订单处理中，请稍后再试');
	}
    this.user2cb[param.user_id] = callback;
    this.order2user[param.order_id] = param.user_id;
	console.log(param);
	param.mtype = HIVE_MSG_TYPE.HiveMsgOrder;
	// param.order_id uint64
	// param.instrument
	// param.act uint8
	param.type = 108; //uint8 'l' 限价单
	param.tif = HIVE_TIF.HiveTifIOC;
	// param.size  float
	// param.px_raw  price  double
	// param.px_int uint32
	// param.px_bps uint32
	// param.flag uint64
	var client = this.socket_client;
	var sbuf = new bytebuffer().littleEndian();
	var req = sbuf.byte(param.mtype)
					.int64(param.order_id)
					.vstring(param.instrument, HIVE_SYMBOL_LEN)
					.byte(param.act)
					.byte(param.type)
					.byte(param.tif)
					.float(param.size)
					.double(param.px_raw)
					.uint32(0)
					.uint32(0)
					.int64(0)
					.pack();
	client.write(req);
	//callback({code:0, msg:'success'});
};

exports.Hive = Hive;
