var socketMVC = require('socket.mvc');
var models = require('./models');
var Account = models.Account;

//Hook-up Socket Listeners
module.exports = function(socket) {
	onJoined(socket);
	onMsg(socket);
	onList(socket);
	onWhosDJ(socket);
	onDisconnect(socket);
	onPlaySong(socket);
	onSongEnded(socket);
};

//Object to hold connected users
var users = {};

//Variables for audio time-syncing
var songPlaying = false;
var curTime, curSong;

//Variables for DJ control
var numSongPlays = 0;


//Socket Listeners----------------------------------------------------------------------------------------------------------------------------

//Handle new user connecting
var onJoined = function(socket) {
	socket.on("join", function(data) {
		//Tell how many other users are connected
		EmitServerMessage(socket, 'There are ' + Object.keys(users).length + 'other users online');
		
		//Create user's object and add to list
		socket.name = data.name;
		var newUser = { 
			name: socket.name, 
			isDJ: false
		};
		if (Object.keys(users).length == 0) {	//If first user, become the DJ
			newUser.isDJ = true;
		}
		users[socket.name] = newUser;
		
		socket.join('room1');
		
		//Plays the current song at the correct time for users who join late
		if (songPlaying) {
			socket.emit('playLate', {
				path: curSong,
				time:  ((Date.now() - curTime) + 50) / 1000	//Puts current time into seconds
			});
		}
		
		BroadcastServerMessage(socket,  data.name + " has joined the room.");
		EmitServerMessage(socket, 'You joined the room', false);
	});
};

//Handle normal chat messages
var onMsg = function(socket) {
	socket.on('msgToServer', function(data) {
		socketMVC.everyone('msg', {
			name: data.name,
			msg: data.msg
		});
	});
};

//Lists all currently connected users
var onList = function(socket) {
	socket.on("list", function(data) {
		var messageToSend = "Current users: ";
		Object.keys(users).forEach(function(key) {		//Loops through users and gets each one's name
			messageToSend += users[key].name + ", ";
		});
		
		EmitServerMessage(socket, messageToSend, false);
	});
};

//Tells user who the current DJ is
var onWhosDJ = function(socket) {
	socket.on("who", function(data) {
		var messageToSend = "Current DJ: ";
		Object.keys(users).forEach(function(key) {		//Loops through users and gets each one's name
			if (users[key].isDJ) {
				messageToSend += users[key].name;
			}
		});
		
		EmitServerMessage(socket, messageToSend, false);
	});
};

//Sends out song streaming info to all sockets
var onPlaySong = function(socket) {
	socket.on("playSong", function(data) {
		if (users[socket.name].isDJ) {	//Checks if user trying to play is the DJ
			//Store data for time-syncing
			songPlaying = true;
			curTime = Date.now();
			curSong = data.path;
			
			socketMVC.everyone('play', {
				path: data.path
			});
		}
	});
};

//Handle when a song ends
var onSongEnded = function(socket) {
	socket.on("songEnded", function() {
		if (users[socket.name].isDJ) {	//Checks if user is the DJ
			if (numSongPlays >= 3) {	//If DJ's time is up, find new DJ
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
				
				EmitServerMessage(socket, messageToSend, true);
			}
			else {
				numSongPlays++;	//If DJ's time isn't up, increase counter
			}
		}
	});
};

//Handle user disconnection
var onDisconnect = function(socket) {
	socket.on('disconnect', function(data) {
		if (users[socket.name].isDJ && Object.keys(users).length > 1){
			
			//Sets new DJ that isn't the disconnecting user
			var newDJIndex;
			do {	//Must fire at least once, continue if disconnecting user was chosen as new DJ
				newDJIndex = RandomUserIndex();
			} while (users[socket.name] == users[newDJIndex])
				
			users[newDJIndex].isDJ = true;
			
			var messageToSend = users[newDJIndex].name + " is the new DJ!";		
			EmitServerMessage(socket, messageToSend, true);
		}
		delete users[socket.name];		//Removes disconnecting user from the list
		
		if (Object.keys(users).length < 1) {	//If room is now empty, stop songs from resuming for new users
			songPlaying = false;
		}
		else {		//Only broadcast messages if there are still users. 								  Done this way so SocketMVC doesn't broadcast these when a new user joins,
			BroadcastServerMessage(socket, socket.name + " has left the room.");						//as it builds an emit queue when there are no connected users
			BroadcastServerMessage(socket, 'There are ' + Object.keys(users).length + ' users online');
		}
	});
};


//Helper Functions--------------------------------------------------------------------------------------------------------------------------------------

//Give random index of object containing users
function RandomUserIndex() {
	var keyArr = Object.keys(users);
	return keyArr[Math.floor(Math.random() * (keyArr.length))];
}

//Self-explanatory, send server message to either everyone or just the calling socket
function EmitServerMessage(socket, message, everyone) {
	if (everyone) {
		socketMVC.everyone('msg', {
			name: 'Server',
			msg: message
		});
	}
	else {
		socket.emit('msg', {
			name: 'Server',
			msg: message
		});
	}
}

//Self-explanatory, send server message to all but the calling socket
function BroadcastServerMessage(socket, message) {
	socket.broadcast.to('room1').emit('msg', {
			name: 'Server',
			msg: message
	});
}