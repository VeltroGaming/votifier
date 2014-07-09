// module dependencies
var net = require("net"),
        events = require("events"),
        util = require("util"),
        Rsa = require("./rsa");

// Votifier class
function Votifier(privateKey, port, debug) {
    // check object instantiation
    if (!(this instanceof Votifier))
        return new Votifier(privateKey, port);

    // settings
    this.version = "1.8";
    this.port = port || 8192;
    this.debug = debug;
    // create RSA decoder
    this.rsa = new Rsa(privateKey);

    // create server
    this.startServer(port);

    // make this an EventEmitter
    events.EventEmitter.call(this);
}
util.inherits(Votifier, events.EventEmitter);

Votifier.prototype.startServer = function() {
    var self = this;
    this.server = net.createServer({allowHalfOpen: true}, function() {
        // redirect to this instance event handler and set correct this
        self.handleConnection.apply(self, arguments);
    });
    this.server.on("error", function(err) {
        self.emit("error", err);
    });
    this.server.listen(this.port);
};

// listen on new connections
Votifier.prototype.handleConnection = function(socket) {
    var self = this;
    if (self.debug) {
        console.log('received connection');
    }
    socket.on("error", function(err) {
        self.emit("error", err);
    });
    // listen on the 256 bytes respone
    socket.once("data", function(data) {
        // check for correct block length
        if (data.length !== 256) {
            if (self.debug) {
                console.log('error: expected length is 256 bytes but got ', data.length, ' bytes');
            }
            self.emit("error", new Error("Bad response length"));
            socket.end("Bad response length\n");
            socket.destroy();
            return;
        }

        // decode block
        var decoder = self.rsa.decrypt(data);
        decoder.once("error", function() {
            if (self.debug) {
                console.log('decoder error');
            }
            self.emit("error", new Error("Bad response content"));
            socket.end("Bad response content\n");
            socket.destroy();
        });
        decoder.once("success", function(data) {
            if (self.debug) {
                console.log('decrypted data is: ', data);
            }
            data = data.split("\n");
            if (data[0] !== "VOTE") {
                self.emit("error", new Error("Check failed (probably a decoding issue)"));
                socket.end("Check failed (probably a decoding issue)\n");
                socket.destroy();
                return;
            }

            // there can be problems with timestamps which are passed in notifications
            // ts can be sent in text or numeric format
            var ts = data[4];

            if (/^\d+$/.test(ts)) {
                // digits only => convert to full length
                while (ts.length < 13) {
                    ts += '0';
                }
                ts = new Date(parseInt(ts, 10));
            } else {
                ts = new Date(ts);
            }

            self.emit("vote", {
                service: data[1],
                user: data[2],
                ip: data[3],
                ts: ts
            });
            socket.end("Okay\n");
            socket.destroy();
        });
    });

    // open protocol with version
    socket.write("VOTIFIER " + this.version + "\n");
};

// export Votifier
module.exports = Votifier;