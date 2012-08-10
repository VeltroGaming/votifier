// module dependencies
var net = require("net"),
	events = require("events"),
	util = require("util"),
	Rsa = require("./rsa");

// Votifier class
var self;
function Votifier(privateKey, port) {
	// check object instantiation
	if(!(this instanceof Votifier)) return new Votifier(privateKey, port);
	
	// save reference
	self = this;
	
	// settings
	port = port || 8192;
	this.version = "1.8";
	
	// create server
	this.server = net.createServer();
	this.server.on("connection", this.handleConnection);
	this.server.listen(8192);
	
	// create RSA decoder
	this.rsa = new Rsa(privateKey);
	
	// make this an EventEmitter
	events.EventEmitter.call(this);
}
util.inherits(Votifier, events.EventEmitter);

// listen on new connections
Votifier.prototype.handleConnection = function(socket) {
	// listen on the 256 bytes respone
	socket.once("data", function(data) {
		// check for correct block length
		if(data.length !== 256) {
			socket.end("Bad response length\n");
			socket.destroy();
			return;
		}
		
		// decode block
		var decoder = self.rsa.decrypt(data);
		decoder.once("error", function(data) {
			socket.end("Bad response content\n");
			socket.destroy();
		});
		decoder.once("success", function(data) {
			data = data.split("\n");
			if(data[0] !== "VOTE") {
				socket.end("Bad response length\n");
				socket.destroy();
				return;
			}
			
			self.emit("vote", data[2], data[1], data[3], new Date(data[4]));
			socket.end("Okay\n");
			socket.destroy();
		});
	});
	
	// open protocol with version
	socket.write("VOTIFIER " + this.version + "\n");
};

// export Votifier
module.exports = Votifier;