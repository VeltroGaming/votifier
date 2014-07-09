// module dependencies
var votifier = require("votifier")(__dirname + "/private.pem");

votifier.on("vote", function(vote) {
	// now you could reward your user
	console.log(
		"Received Vote!",
		" -> Username:   " + vote.user,
		" -> Service: " + vote.service,
		" -> User IP:    " + vote.ip,
		" -> Date:       " + vote.date.toGMTString()
	);
});

votifier.on("error", function(error) {
	// should never happen
	console.log(
		"D'oh!",
		error
	);
});
