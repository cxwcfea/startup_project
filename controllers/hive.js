var net = require("net"),
	_ = require('underscore'),
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
}

Hive.prototype.destroy = function() {
    this.socket_client.end();
    this.socket_client.destroy();
}

Hive.prototype._delay = function(time) {
	for(var start = +new Date; +new Date - start <= time; ) { }
}

Hive.prototype.login = function (){
	var param = {};
	param.mtype = HIVE_MSG_TYPE.HiveMsgLoginReq;
	param.ip = this.ip;
	param.port = this.port;
	param.investor = this.investor;
	param.password = this.password;
	param.front_addr = this.front_addr;
	param.client_id = this.client_id;
	param.version = this.version;
	param.interval = this.interval;
	// socket_client.setEncoding('binary');
	console.log(param);
	var client = this.socket_client;
	client.connect(param.port, param.ip, function(){
		console.log('connect to '+ param.ip);
		var sbuf = new bytebuffer().littleEndian();
		var req = sbuf.byte(param.mtype)
						.vstring(param.investor, HIVE_USERNAME_LEN)
						.vstring(param.password, HIVE_PASSWORD_LEN)
						.vstring(param.front_addr, HIVE_HOSTADDR_LEN)
						.uint32(param.client_id)
						.byte(param.version)
						.byte(param.interval)
						.pack();
		// console.log(req);
		client.write(req);
		console.log('login send req');
	});
	var that = this;
	client.on('data',function(data){
		if(that.isLogin == false){
			console.log('login recv response ');
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
			if(arr[0] == HIVE_MSG_TYPE.HiveMsgLoginRsp && arr[1] == 0)
				that.isLogin = true;
			console.log('login '+that.isLogin);
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
		console.log('error:'+error);
	});
	client.on('close',function(){
		console.log('Connection closed');
	});
}


Hive.prototype.createOrder = function (param, callback){
	console.log('in createOrder, login '+this.isLogin);
	if(!this.isLogin){
        return;
		//callback({code:-1, msg:'No login.'}, {});
	}
    //console.log('--------hive createOrder.');
	if(this.user2cb[param.user_id] === undefined) {
		this.user2cb[param.user_id] = callback;
        //console.log(this.user2cb);
		this.order2user[param.order_id] = param.user_id;
	} else {
		console.log('previous order in process, abort current one.');
        callback('请稍等再试');
		return;
	}
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
	// console.log(req);
	client.write(req);
	console.log('createOrder send req');
	//callback({code:0, msg:'success'});
}
exports.Hive = Hive;
