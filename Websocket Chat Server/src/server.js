var http = require('http');
var fs = require('fs');
var socketio = require('socket.io');

var port = process.env.PORT || process.env.NODE_PORT || 3000;

//read the client html file into memory
//__dirname in node is the current directory
//in this case the same folder as the server js file
var index = fs.readFileSync(__dirname + '/../client/client.html');

function onRequest(request, response) {

 response.writeHead(200, {"Content-Type": "text/html"});
 response.write(index);
 response.end();
}

var app = http.createServer(onRequest).listen(port);

console.log("Listening on 127.0.0.1:" + port);

//pass in the http server into socketio and grab the websocket server as io
var io = socketio(app);

//object to hold all of our connected users
var users = {};

var onJoined = function(socket) {
	socket.on("join", function(data) {

		var joinMsg = {
			name: 'server',
			msg: 'There are ' + Object.keys(users).length + ' users online'
		};
	
		socket.emit('msg', joinMsg);
		socket.name = data.name;
		
		var newUser = { 
			name: socket.name, 
			score: 0,
			isDJ: false
		};
		if (Object.keys(users).length == 0) {
			newUser.isDJ = true;
		}
		users[socket.name] = newUser;
		
		socket.join('room1');
		
		socket.broadcast.to('room1').emit('msg', {
			name: 'server',
			msg: data.name + " has joined the room."
		});
		
		socket.emit('msg', {
			name: 'server',
			msg: 'You joined the room'
		});
	});
};

var onMsg = function(socket) {
	socket.on('msgToServer', function(data) {
		io.sockets.in('room1').emit('msg', {
			name: data.name,
			msg: data.msg
		});
	});
};

var onScore = function(socket) {
	socket.on('score', function(data) {
		var value = users[data.name].score;
		var messageToSend = "Your score is: " + value;
		
		socket.emit('msg', {
			name: data.name,
			msg: messageToSend
		});
	});
};

var onRename = function(socket) {
	socket.on('rename', function(data) {
		users[socket.name] = data.newN;			//Set the new name, keeping the same index in the list of users
		
		io.sockets.in('room1').emit('msg', {		//Broadcast name change
			name: 'server',
			msg: data.name + " has changed their name to " + data.newN
		});
	});
};

var onList = function(socket) {
	socket.on("list", function(data) {
		var messageToSend = "Current users: ";
		
		Object.keys(users).forEach(function(key) {		//Loops through users and gets each one's name
			messageToSend += users[key].name + " ";
		});
		
		socket.emit('msg', {
			name: 'server',
			msg: messageToSend
		});
	});
};

var onUpV = function(socket) {
	socket.on("upvote", function(data) {
		users[data.targ].score++;
		
		var messageToSend = data.name + " has raised " + data.targ + "'s score to " + users[data.targ].score + ".";
		
		io.sockets.in('room1').emit('msg', {
			name: 'server',
			msg: messageToSend
		});
	});
};

var onDownV = function(socket) {
	socket.on("downvote", function(data) {
		users[data.targ].score--;
		
		var messageToSend = data.name + " has lowered " + data.targ + "'s score to " + users[data.targ].score + ".";
		
		io.sockets.in('room1').emit('msg', {
			name: 'server',
			msg: messageToSend
		});
	});
};

var onWhosDJ = function(socket) {
	socket.on("who", function(data) {
		var messageToSend = "Current DJ: ";
		Object.keys(users).forEach(function(key) {		//Loops through users and gets each one's name
			if (users[key].isDJ) {
				messageToSend += users[key].name;
			}
		});
		
		socket.emit('msg', {
			name: 'server',
			msg: messageToSend
		});
	});
};

var onDisconnect = function(socket) {
	socket.on('disconnect', function(data) {
		delete users[socket.name];			//Removes disconnecting user from the list
		
		socket.broadcast.to('room1').emit('msg', {
			name: 'server',
			msg: socket.name + " has left the room."
		});
		
		socket.broadcast.to('room1').emit('msg', {
			name: 'server',
			msg: 'There are ' + Object.keys(users).length + ' users online'
		});
	});
};

io.sockets.on("connection", function(socket) {
	onJoined(socket);
	onMsg(socket);
	onScore(socket);
	onList(socket);
	onRename(socket);
	onUpV(socket);
	onDownV(socket);
	onWhosDJ(socket);
	onDisconnect(socket);
});

console.log('websocket server started');