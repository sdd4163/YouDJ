var models = require('./models');
var Account = models.Account;

module.exports = function(socket) {
	onJoined(socket);
	onMsg(socket);
	onScore(socket);
	onList(socket);
	onRename(socket);
	onUpV(socket);
	onDownV(socket);
	onWhosDJ(socket);
	onDisconnect(socket);
	onPlaySong(socket);
};
var socketMVC = require('socket.mvc');
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
		socketMVC.everyone('msg', {
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
		
		socketMVC.everyone('msg', {		//Broadcast name change
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
		//users[data.targ].score++;
		
		//var conditions = { username: data.targ };
		//Account.AccountModel.update({ username: data.targ }, { popularity: 1 }, { multi: true }, callback);
		
		var messageToSend = data.name + " has raised " + data.targ + "'s score to " + users[data.targ].score + ".";
		
		socketMVC.everyone('msg', {
			name: 'server',
			msg: messageToSend
		});
	});
};

var onDownV = function(socket) {
	socket.on("downvote", function(data) {
		users[data.targ].score--;
		
		var messageToSend = data.name + " has lowered " + data.targ + "'s score to " + users[data.targ].score + ".";
		
		socketMVC.everyone('msg', {
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

var onPlaySong = function(socket) {
	socket.on("playSong", function(data) {
		socketMVC.everyone('play', {
			path: data.path
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