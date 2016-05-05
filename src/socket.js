var models = require('./models');
var Account = models.Account;

module.exports = function(socket) {
	onJoined(socket);
	onMsg(socket);
	onScore(socket);
	onList(socket);
	onUpV(socket);
	onDownV(socket);
	onWhosDJ(socket);
	onDisconnect(socket);
	onPlaySong(socket);
	onSongEnded(socket);
};
var socketMVC = require('socket.mvc');
var users = {};

//Variables for time syncing
var songPlaying = false;
var curTime, curSong;
var numSongPlays = 0;


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
		
		//Plays the current song at the correct time for new users
		if (songPlaying) {
			socket.emit('playLate', {
				path: curSong,
				time:  ((Date.now() - curTime) + 90) / 1000	//Puts current time into seconds
			});
		}
		
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
		if (users[socket.name].isDJ) {
			songPlaying = true;
			curTime = Date.now();
			curSong = data.path;
			
			socketMVC.everyone('play', {
				path: data.path
			});
		}
	});
};

var onSongEnded = function(socket) {
	socket.on("songEnded", function() {
		if (numSongPlays >= 3) {
			numSongPlays = 0;
			Object.keys(users).forEach(function(key) {		//Loops through users
				if (users[key].isDJ) {
					users[key].isDJ = false;
				}
			});
			//Sets random user as new DJ
			var newDJIndex = RandomUserIndex();
			users[newDJIndex].isDJ = true;
			var messageToSend = users[newDJIndex].name + " is the new DJ!";
			
			socketMVC.everyone('msg', {
				name: 'server',
				msg: messageToSend
			});
		}
		else {
			numSongPlays++;
		}
	});
};

var onDisconnect = function(socket) {
	socket.on('disconnect', function(data) {
		if (users[socket.name].isDJ && Object.keys(users).length > 1){
			//Sets new DJ that isn't the disconnecting user
			var newDJIndex;
			do {
				newDJIndex = RandomUserIndex();
			} while (users[socket.name] == users[newDJIndex])
			users[newDJIndex].isDJ = true;
			//Server message of new DJ
			var messageToSend = users[newDJIndex].name + " is the new DJ!";		
			socketMVC.everyone('msg', {
				name: 'server',
				msg: messageToSend
			});
		}
		delete users[socket.name];			//Removes disconnecting user from the list
		
		if (Object.keys(users).length < 1) {
			songPlaying = false;	//Sets songPlaying to false so users joining an empty room don't resume a song
		}
		
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


function RandomUserIndex() {
	var keyArr = Object.keys(users);
	return keyArr[Math.floor(Math.random() * (keyArr.length))];
}