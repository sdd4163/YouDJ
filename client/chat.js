"use strict"

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
	if (messageToSend == "/cmd") {	//Lists chat commands
		socket.emit('cmd', {
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
	else {
		socket.emit('msgToServer', {	//If no commands, just send a chat message
			name: user,
			msg: messageToSend
		});
	}
}

//Self-explanatory, socket emit function specifically for the "Boo!" button
function booDJ(e) {
	socket.emit('boo', {
	});
}