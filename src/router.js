var controllers = require('./controllers');
var mid = require('./middleware');

var router = function(app) {
	app.get("/login", mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
	app.post("/login", mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
	app.get("/signup", mid.requiresSecure, mid.requiresLogout, controllers.Account.signupPage);
	app.post("/signup", mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
	app.get("/logout", mid.requiresLogin, controllers.Account.logout);
	app.get("/adder", mid.requiresLogin, controllers.Song.adderPage);
	app.post("/adder", mid.requiresLogin, controllers.Song.add);
	app.get("/app", mid.requiresLogin, controllers.Song.appPage);
	app.get("/allSongs", mid.requiresLogin, controllers.Song.songsPage);
	app.get("/", mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
};

module.exports = router;