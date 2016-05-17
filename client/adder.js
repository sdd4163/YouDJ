"use strict";

$(document).ready(function() {
	//Soundcloud initialization
	var clientID = '0e52caf926d2c4e08f6c2175e125d618';
	SC.initialize({
		client_id: clientID
	});
	
	
	//Get references to and setup audio element and controls
	var audioElement = document.querySelector('audio');
	audioElement.volume = 0.3;
	audioElement.onended = function() {
		socket.emit('songEnded', {
		});
	};
	var volumeSlider = document.querySelector('#playerVol');
	volumeSlider.onchange = function(e) {
		audioElement.volume = volumeSlider.value;
	};
    
	
	//Hook-up socket chat elements and socket listeners
	var send = document.querySelector("#send");
	send.addEventListener('click', sendMessage);
	
	var boo = document.getElementById('boo');
	boo.addEventListener('click', booDJ);
	
	socket.on('play', function(data) {
		playStream(data.path);
	});
	socket.on('playLate', function(data) {
		playStreamLate(data.path, data.time);
	});
	
	
	//Get references to search elements
	var searchTxt = document.getElementById("search");
	var searchResult = document.getElementById('searchResults');
	
	//Add event listener to Soundcloud search button 
	$("#searchB").on("click", function(e) {		//Currently have a weird mix between JQuery and JS, should probably be changed
		e.preventDefault();
		
		var html = "";
		var searchData = searchTxt.value;
		
		//Get list of tracks (limited to 3) from Soundcloud
		SC.get('/tracks', {q: searchData, limit: 3 }, function (tracks) {
			if (tracks.length > 0) {
				html = "<form>";
				for (var i = 0; i < tracks.length; i++) 
				{
					//Create radio buttons for each track
					html += "<input id='song" + i + "' type='radio' name='songs' value='" + tracks[i].stream_url + "' class='" + tracks[i].user.username + "' />" + tracks[i].title + "<br>";
				}
				html += "</form>";
				searchResult.innerHTML = html;	//Add results to page
				
				//Reference and add listeners to each song listed
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
			}
			else {		//If no search results, inform user
				html = "<p>There were no tracks found! Please try again</p>";
				searchResult.innerHTML = html;
			}
		});
	});
	
	
	//Helper Functions-----------------------------------------------------------------------------------------------
	
	//Functions to either start the stream, or start and play on the current time
	function playStream(path){
		path += '?client_id=' + clientID;
		audioElement.src = path;
		audioElement.play();
	}
	function playStreamLate(path, time){
		path += '?client_id=' + clientID;
		audioElement.src = path;
		audioElement.currentTime = time;
		audioElement.play();
	}
	
	//Send out message so all users start the song stream
	function playSong(url, username){
		socket.emit('playSong', {
			path: url,
			artist: username
		});
	}
	
	function handleError(message) {
        console.log(message);
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
        if($("#songTitle").val() === '' || $("#songArtist").val() === '') {
            handleError("Error! All fields are required!");
            return false;
        }
        sendAjax($("#songForm").attr("action"), $("#songForm").serialize());
        
        return false;
    });
});