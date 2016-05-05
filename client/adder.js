"use strict";

$(document).ready(function() {
	var audioElement = document.querySelector('audio');
	var clientID = '0e52caf926d2c4e08f6c2175e125d618';
	
    function handleError(message) {
        console.log(message);
    }
	
	//Socket stuff
	var send = document.querySelector("#send");
	send.addEventListener('click', sendMessage);
	
	socket.on('play', function(data) {
		playStream(data.path);
	});
	socket.on('playLate', function(data) {
		playStreamLate(data.path, data.time);
	});
	
	//Soundcloud stuff
	SC.initialize({
		client_id: clientID
	});
	
	$("#searchB").on("click", function(e) {
		e.preventDefault();
		var searchTxt = document.getElementById("search");
		var searchData = searchTxt.value;
		var searchResult = document.getElementById('searchResults');
				
		var html = "";
		
		SC.get('/tracks', {q: searchData, limit: 3 }, function (tracks) {
			html = "<form>";
			for (var i = 0; i < tracks.length; i++) 
			{
				//Create radio buttons for each track
				html += "<input id='song" + i + "' type='radio' name='songs' value='" + tracks[i].stream_url + "' class='" + tracks[i].user.username + "' />" + tracks[i].title + "<br>";
			}
			html += "</form>";
			searchResult.innerHTML = html;
			
			var song0 = document.getElementById("song0");
			var song1 = document.getElementById("song1");
			var song2 = document.getElementById("song2");
			
			song0.onchange = function(e) {
				playSong(song0.value, song0.className);
			};
			song1.onchange = function(e) {
				playSong(song1.value, song1.className);
			};
			song2.onchange = function(e) {
				playSong(song2.value, song2.className);
			};
		});
		$("#searchResults").animate({
			backgroundColor: "gray",
			color: "#fff",
			height: 60
		}, 1000);
	});
	
	audioElement.onended = function() {
		socket.emit('songEnded', {
		});
	};
	
	function playStream(path){
		path += '?client_id=' + clientID;
		audioElement.src = path;
		audioElement.play();
		audioElement.volume = 0.5;
	}
	function playStreamLate(path, time){
		path += '?client_id=' + clientID;
		audioElement.src = path;
		audioElement.play();
		audioElement.currentTime = time;
		audioElement.volume = 0.5;
	}
	function playSong(url, username){
		socket.emit('playSong', {
			path: url,
			artist: username
		});
	}
    
    function sendAjax(action, data) {
        $.ajax({
            cache: false,
            type: "POST",
            url: action,
            data: data,
            dataType: "json",
            success: function(result, status, xhr) {
                window.location = result.redirect;
            },
            error: function(xhr, status, error) {
                var messageObj = JSON.parse(xhr.responseText);
                handleError(messageObj.error);
            }
        });        
    }
    
    $("#addSongSubmit").on("click", function(e) {
        e.preventDefault();
        if($("#songTitle").val() == '' || $("#songArtist").val() == '') {
            handleError("Error! All fields are required!");
            return false;
        }
        sendAjax($("#songForm").attr("action"), $("#songForm").serialize());
        
        return false;
    });
});