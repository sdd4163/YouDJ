var models = require('../models');
var Account = models.Account;

//Functions to direct users to correct pages
var loginPage = function(req, res) {
	res.render('login', { csrfToken: req.csrfToken() });
};
var signupPage = function(req, res) {
	res.render('signup', { csrfToken: req.csrfToken() });
};
var appPage = function(req, res) {
	res.render('app', {csrfToken: req.csrfToken(), account: req.session.account});
};

//Clears session and returns to root page
var logout = function(req, res) {
	req.session.destroy();
	res.redirect('/');
};

//Authenticates account credentials then logs in
var login = function(req, res) {
	Account.AccountModel.authenticate(req.body.username, req.body.pass, function(err, account) {
		if(err || !account) {
			return res.status(400).json({error: "Wrong username or password"});
		}
		
		req.session.account = account.toAPI();
		
		res.json({redirect: '/app'});
	});
};

//Creates hash then new user data for storage
var signup = function(req, res) {
	Account.AccountModel.generateHash(req.body.pass, function(salt, hash) {
		var accountData = {
			username: req.body.username,
			salt: salt,
			password: hash
		};
		
		var newAccount = new Account.AccountModel(accountData);		//Create new model using data
		newAccount.save(function(err) {
			if(err) {
				console.log(err);
				return res.status(400).json({error: 'An error occurred'});
			}
			req.session.account = newAccount.toAPI();
			
			res.json({redirect: '/app'});
		});
	});
};

//Exports
module.exports.loginPage = loginPage;
module.exports.login = login;
module.exports.logout = logout;
module.exports.signupPage = signupPage;
module.exports.signup = signup;
module.exports.appPage = appPage;