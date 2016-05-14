var socket;
var user;

function connectSocket(username) {
	console.log("connect");
	user = username;
	var message = document.querySelector("#message");
	var chat = document.querySelector("#chat");
	
	socket = io.connect();
	
	//listener for connect event
	socket.on('connect', function() {
		console.log('connecting');
		socket.emit('join', { name: user });
	});
	
	//listener for msg event
	socket.on('msg', function(data) {
		chat.innerHTML += data.name + ": " + data.msg + '\n';
	});
}

function sendMessage(e) {
	var messageToSend = message.value;
	
	//Check for chat commands
	if (messageToSend == "/score") {	//REMOVE LATER!!!!!!!!!!!!!!!!!!!!!!!!
		socket.emit('score', {
			name: user
		});
	}
	else if (messageToSend == "/list") {	//Lists currently connected users
		socket.emit('list', {
		});
	}
	else if (messageToSend == "/who") {		//Tells who the DJ is
		socket.emit('who', {
		});
	}
	else if (messageToSend.indexOf("/upvote") != -1) {	//REMOVE LATER!!!!!!!!!!!!!!!!!!!!!!!!
		var targetName = messageToSend.slice(8);
		socket.emit('upvote', {
			name: user,
			targ: targetName
		});
	}
	else {
		socket.emit('msgToServer', {	//If no commands, just send a chat message
			name: user,
			msg: messageToSend
		});
	}
}