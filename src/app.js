var path = require('path');
var express = require('express');
var compression = require('compression');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var url = require('url');
var csrf = require('csurf');
var socketMVC = require('socket.mvc');		//MVC-oriented socketio package, allows socket calls from any file

//Mongoose Init
var dbURL = process.env.MONGODB_URI || "mongodb://localhost/YouDJ";
var db = mongoose.connect(dbURL, function(err) {
	if(err) {
		console.log("Could not connect to database");
		throw err;
	}
});

//Redis Init
var redisURL = {
	hostname: 'localhost',
	port: 6379
};
var redisPASS;
if (process.env.REDISCLOUD_URL) {
	redisURL = url.parse(process.env.REDISCLOUD_URL);
	redisPASS = redisURL.auth.split(":")[1];
}

var router = require('./router.js');

var port = process.env.PORT || process.env.NODE_PORT || 3000;

var app = express();
app.use('/assets', express.static(path.resolve(__dirname+'/../client/')));
app.use(compression());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(session({
	key: "sessionid",
	store: new RedisStore({
		host: redisURL.hostname,
		port: redisURL.port,
		pass: redisPASS
	}),
	secret: 'YouDJ',
	resave: true,
	saveUninitialized: true,
	cookie: {
		httpOnly: true
	}
}));
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(favicon(__dirname + '/../client/img/favicon.png'));
app.disable('x-powered-by');
app.use(cookieParser());

//Csurf must come AFTER app.use(cookieParser()); and app.use(session...);
//Should come BEFORE the router
app.use(csrf());
app.use(function (err, req, res, next) {
	if (err.code !== 'EBADCSRFTOKEN') {
		return next(err);
	}
	return;
})

router(app);

var server = app.listen(port, function(err) {
	if(err) {
		throw err;
	}
	console.log('Listening on port ' + port);
});

//Connect Socketio, then connect SocketMVC
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
	socketMVC.init(io, socket, {
		debug: true,
		filePath: ["./src/socket.js"]
	});
});