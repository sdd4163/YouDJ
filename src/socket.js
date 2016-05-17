var socketMVC = require('socket.mvc');
var models = require('./models');
var Account = models.Account;

//Hook-up Socket Listeners
module.exports = function(socket) {
	onJoined(socket);
	onMsg(socket);
	onList(socket);
	onWhosDJ(socket);
	onPlaySong(socket);
	onSongEnded(socket);
	onBoo(socket);
	onCommand(socket);
	onDisconnect(socket);
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
		//Create user's object and add to list
		socket.name = data.name;
		var newUser = { 
			name: socket.name, 
			isDJ: false,
			booCount: 0,
			hasBooed: false
		};
		if (Object.keys(users).length === 0) {	//If first user, become the DJ
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
		EmitServerMessage(socket, 'Type /cmd to see chat commands', false);
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
		
		var currentDJIndex = GetDJIndex();
		messageToSend += users[currentDJIndex].name;
		
		EmitServerMessage(socket, messageToSend, false);
	});
};

//Sends out song streaming info to all sockets
var onPlaySong = function(socket) {
	socket.on("playSong", function(data) {
		if (users[socket.name].isDJ) {	//Checks if user trying to play is the DJ
		
			if (songPlaying) {	//Increases number of played songs if song is interrupted
				numSongPlays++;
			}
			
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
			if (numSongPlays >= 3) {	//If DJ's time is up, find new DJ and reset song plays
				numSongPlays = 0;
				NewDJ(socket);
			}
			else {
				numSongPlays++;	//If DJ's time isn't up, increase counter
			}
		}
	});
};

//Handle users booing the DJ
var onBoo = function(socket) {
	socket.on('boo', function(data) {
		if (!users[socket.name].hasBooed) {		//Check if user can still boo
			users[socket.name].hasBooed = true;
			EmitServerMessage(socket, "You booed the DJ!", false);
			
			
			var currentDJIndex = GetDJIndex();	//Get current Dj's index and increase their boo count
			users[currentDJIndex].booCount++;
	
			if (users[currentDJIndex].booCount > Object.keys(users).length / 2) {	//If DJ has been booed too many times, change DJs
				users[currentDJIndex].booCount = 0;
				EmitServerMessage(socket, users[currentDJIndex].name + " has been booed too many times!", true);
				NewDJ(socket);
			}
		}
		else {
			EmitServerMessage(socket, "You've already booed this DJ! Wait until the DJ changes to boo again.", false);
		}
	});
};

//Handle user commands request
var onCommand = function(socket) {
	socket.on('cmd', function(data) {
		var messageToSend1 = "/list - List all connected users";	//Prints out all chat commands
		var messageToSend2 = "/who - Tell who the DJ is";
		
		EmitServerMessage(socket, messageToSend1, false);
		EmitServerMessage(socket, messageToSend2, false);
	});
};

//Handle user disconnection
var onDisconnect = function(socket) {
	socket.on('disconnect', function(data) {
		if (users[socket.name].isDJ && Object.keys(users).length > 1){
			//Sets new DJ if disconnecting user is the DJ
			NewDJ(socket);
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

//Return the index of the current DJ
function GetDJIndex() {
	var djIndex;
	Object.keys(users).forEach(function(key) {		//Loops through users and returns the DJ's index
		if (users[key].isDJ) {
			djIndex = key;
		}
	});
	return djIndex;
}

//Choose random new DJ who isn't the previous
function NewDJ(socket) {
	Object.keys(users).forEach(function(key) {		//Loops through users and resets their Boo enabler
		users[key].hasBooed = false;
	});
	
	if (Object.keys(users).length > 1) {	//Only choose new DJ if there are other people in the room
		var currentDJIndex = GetDJIndex();
		
		var newDJIndex;
		do {								//Must fire at least once, continue until new DJ is chosen
			newDJIndex = RandomUserIndex();
		} while (currentDJIndex == newDJIndex);
			
		users[currentDJIndex].isDJ = false;		//Change DJ and reset their boos
		users[currentDJIndex].booCount = 0;
		users[newDJIndex].isDJ = true;
		
		numSongPlays = 0;		//Reset number of played songs
		
		var messageToSend = users[newDJIndex].name + " is the new DJ!";
		EmitServerMessage(socket, messageToSend, true);
	}
}