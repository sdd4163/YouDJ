var socket;

function connectSocket(e) {
	console.log("connect");
	var message = document.querySelector("#message");
	var chat = document.querySelector("#chat");
	
	socket = io.connect();
	
	//listener for connect event
	socket.on('connect', function() {
		console.log('connecting');
		
		var user = document.querySelector("#username").value;
		if(!user) {
			user = 'unknown';
		}
		socket.emit('join', { name: user });
	});
	
	//listener for msg event
	socket.on('msg', function(data) {
		console.log(data);
		chat.innerHTML += data.name + ": " + data.msg + '\n';
	});
}

function sendMessage(e) {
	var user = document.querySelector("#username").value;
	var messageToSend = message.value;
	
	if (messageToSend == "/score") {
		socket.emit('score', {
			name: user
		});
	}
	else if (messageToSend == "/list") {
		socket.emit('list', {
		});
	}
	else if (messageToSend == "/who") {
		socket.emit('who', {
		});
	}
	else if (messageToSend.indexOf("/rename") != -1) {				//Searches for the rename command, then splits up the string to get the new name
		var newName = messageToSend.slice(8);
		document.querySelector("#username").value = newName;
		socket.emit('rename', {
			name: user,
			newN: newName
		});
	}
	else if (messageToSend.indexOf("/upvote") != -1) {				//Searches for the rename command, then splits up the string to get the new name
		var targetName = messageToSend.slice(8);
		socket.emit('upvote', {
			name: user,
			targ: targetName
		});
	}
	else if (messageToSend.indexOf("/downvote") != -1) {				//Searches for the rename command, then splits up the string to get the new name
		var targetName = messageToSend.slice(10);
		socket.emit('downvote', {
			name: user,
			targ: targetName
		});
	}
	else {
		socket.emit('msgToServer', {			//If no commands, just send a message
			name: user,
			msg: messageToSend
		});
	}
}