//Verifies the user is logged in validly
var requiresLogin = function(req, res, next) {
	if (!req.session.account) {
		return res.redirect('/');
	}
	next();
};

//Verifies the user isn't logged in
var requiresLogout = function(req, res, next) {
	if (req.session.account) {
		return res.redirect('/app');
	}
	next();
};

//Ensures a secure connection
var requiresSecure = function(req, res, next) {
	if (req.headers['x-forwarded-proto'] != 'https') {
		return res.redirect('https://' + req.hostname + req.url);
	}
	next();
};

//Ignores security requirement
var bypassSecure = function(req, res, next) {
	next();
};

module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;

if (process.env.NODE_ENV === "production") {
	module.exports.requiresSecure = requiresSecure;
}
else {
	module.exports.requiresSecure = bypassSecure;
}