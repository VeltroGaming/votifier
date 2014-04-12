// module dependencies
var votifier = require("votifier")(__dirname + "/private.pem");

votifier.on("vote", function(user, server, ip, date) {
	// now you could reward your user
	console.log(
		"Received Vote!",
		" -> Username:   " + user,
		" -> Serverlist: " + server,
		" -> User IP:    " + ip,
		" -> Date:       " + date.toGMTString()
	);
});

votifier.on("error", function(error) {
	// should never happen
	console.log(
		"D'oh!",
		error
	);
});
