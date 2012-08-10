// module dependencies
var votifier = require("votifier")(__dirname + "/private.pem");

votifier.on("vote", function(user, server, ip, date) {
	console.log(
		"Received Vote!",
		" -> Username:   " + user,
		" -> Serverlist: " + server,
		" -> User IP:    " + ip,
		" -> Date:       " + date.toGMTString()
	);
});