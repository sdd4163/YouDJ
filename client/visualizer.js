(function(){
		"use strict";
		
		//Constants
		var NUM_SAMPLES = 1024;
		var SCREEN_RADIUS = 755;
		
		//Variables
		var canvas, ctx, canvas2, ctx2;
		var audioElement, analyserNode;
		var drawing, ready, clickLoc, mouseLoc, lines;
		var circleRadius, strokeColor, angle, thickness;
		var circleBox, lineBox, linesBox, crazyBox;
		var style;
		
		//Init - function called when the page is loaded
		function init(){
			//Set up canvas references and variables
			canvas = document.querySelector('#canvas');
			ctx = canvas.getContext("2d");
			canvas2 = document.querySelector('#bCanvas');
			ctx2 = canvas2.getContext("2d");
			
			strokeColor = 'rgba(0, 255, 0, 0.6)';
			circleRadius = 10;
			angle=0;
			thickness = 5;
			
			ready = false;
			drawing = false;
			lines = new Uint8Array(100);
			circleBox = true;
			lineBox = true;
			linesBox = true;
			style = "one";
			
			//Get reference to <audio> element on page
			audioElement = document.querySelector('audio');
			
			//Call helper function and get an analyser node
			analyserNode = createWebAudioContextWithAnalyserNode(audioElement);
			audioElement.crossOrigin = "anonymous";
			
			//Get all our controls working
			setupUI();
			
			//Setup map function
			Number.prototype.map = function (in_min, in_max, out_min, out_max) {				//Gotten from http://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
				return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;		//User: August Miller
			};
			
			//Mouse
			canvas.onmousedown = doMousedown;
			
			//Start animation loop
			update();
		}
		function createWebAudioContextWithAnalyserNode(audioElement) {
			var audioCtx, analyserNode, sourceNode;
			//Create new AudioContext
			// The || is because WebAudio has not been standardized across browsers yet
			// http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
			audioCtx = new (window.AudioContext || window.webkitAudioContext);
			
			//Create an analyser node
			analyserNode = audioCtx.createAnalyser();
			
			/*
			We will request NUM_SAMPLES number of samples or "bins" spaced equally 
			across the sound spectrum.
			
			If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
			the third is 344Hz. Each bin contains a number between 0-255 representing 
			the amplitude of that frequency.
			*/ 
			
			//fft stands for Fast Fourier Transform
			analyserNode.fftSize = NUM_SAMPLES;
			
			//Hook up the <audio> element to the analyserNode
			sourceNode = audioCtx.createMediaElementSource(audioElement); 
			sourceNode.connect(analyserNode);
			
			//Connect to the destination i.e. speakers
			analyserNode.connect(audioCtx.destination);
			
			return analyserNode;
		}
		
		//Sets up the functions for the whole UI
		function setupUI(){
			document.querySelector("#bGColor").onchange = function(e){
				canvas2.style.backgroundColor = e.target.value;
			};
			document.querySelector("#sColor").onchange = function(e){
				strokeColor = e.target.value;
			};
			document.querySelector("#style").onchange = function(e){
				style = e.target.value;
			};
			document.querySelector("#radiusSlider").onchange = function(e){
				circleRadius = e.target.value * 2;
			};
			document.querySelector("#lineThicknessSlider").onchange = function(e){
				thickness = e.target.value;
			};
			document.querySelector("#circleBox").onchange = function(e){
				circleBox = !circleBox;
			};
			document.querySelector("#lineBox").onchange = function(e){
				lineBox = !lineBox;
			};
			document.querySelector("#linesBox").onchange = function(e){
				linesBox = !linesBox;
			};
			document.querySelector("#saveButton").onclick = function(e){
				localStorage.setItem("BGColor", canvas2.style.backgroundColor);
				localStorage.setItem("SColor", strokeColor);
				localStorage.setItem("Style", style);
				localStorage.setItem("Radius", circleRadius);
				localStorage.setItem("LineThickness", thickness);
				if (circleBox){
					localStorage.setItem("CircleOn", "true");
				}
				else{
					localStorage.setItem("CircleOn", "false");
				}
				if (lineBox){
					localStorage.setItem("WaveOn", "true");
				}
				else{
					localStorage.setItem("WaveOn", "false");
				}
				if (linesBox){
					localStorage.setItem("LinesOn", "true");
				}
				else{
					localStorage.setItem("LinesOn", "false");
				}
				if (crazyBox){
					localStorage.setItem("CrazyOn", "true");
				}
				else{
					localStorage.setItem("CrazyOn", "false");
				}
			};
			document.querySelector("#loadButton").onclick = function(e){
				canvas2.style.backgroundColor = localStorage.getItem("BGColor");
				strokeColor = localStorage.getItem("SColor");
				style = localStorage.getItem("Style");
				circleRadius = localStorage.getItem("Radius");
				thickness = localStorage.getItem("LineThickness");
				if (localStorage.getItem("CircleOn") == "true"){
					circleBox = true;
				}
				else if (localStorage.getItem("CircleOn") == "false"){
					circleBox = false;
				}
				if (localStorage.getItem("WaveOn") == "true"){
					lineBox = true;
				}
				else if (localStorage.getItem("WaveOn") == "false"){
					lineBox = false;
				}
				if (localStorage.getItem("LinesOn") == "true"){
					linesBox = true;
				}
				else if (localStorage.getItem("LinesOn") == "false"){
					linesBox = false;
				}
				if (localStorage.getItem("CrazyOn") == "true"){
					crazyBox = true;
				}
				else if (localStorage.getItem("CrazyOn") == "false"){
					crazyBox = false;
				}
			};
		}
		
		// HELPER, makes a new color
		function makeColor(red, green, blue, alpha){
   			var color='rgba('+red+','+green+','+blue+', '+alpha+')';
   			return color;
		}
		// HELPER, gets the mouse position
		function getMouse(e){
			var mouse = {};
			mouse.x = e.pageX - e.target.offsetLeft - 8;
			mouse.y = e.pageY - e.target.offsetTop - 8;
			return mouse;
		}
		
		// HELPER, clears canvas when the canvas is clicked
		function doMousedown(e){
			clearCanvas(ctx2);
		}
		
		//HELPER, Clears the input canvas
		function clearCanvas(ctx){
			ctx.clearRect(0, 0, 1280, 800);
		}
		
		//Update Loop
		function update() {
			//Read in current audio data
			requestAnimationFrame(update);
			var data = new Uint8Array(NUM_SAMPLES/2);
			var wave = new Uint8Array(NUM_SAMPLES/2);
			
			analyserNode.getByteFrequencyData(data);
			analyserNode.getByteTimeDomainData(wave);
						
			clearCanvas(ctx);//clearing the top canvas
			
			
			drawBottom(data, wave);
			drawTop(data, wave);
		}
		
		//Draws the bottom canvas
		function drawBottom(data, wave){
			var space = canvas.width / data.length;
			ctx.save();
			ctx.lineWidth = 3;
			ctx.strokeStyle = strokeColor;
			var j = 0;
			
			
			for(var i = 0; i < data.length; i++)
			{
				//default line - audio frequency
				if (lineBox)
				{
					ctx.beginPath();
					ctx.moveTo(i * space, 750 - data[i]);
					if (i == (NUM_SAMPLES / 2) - 1)
					{
						ctx.lineTo(canvas.width, 750 - data[i]);
					}
					else
					{
						ctx.lineTo((i + 1) * space, 750 - data[i + 1]);
					}
					ctx.stroke();
					ctx.closePath();
				}
				
				//default line - wave
				ctx.beginPath();
				ctx.moveTo(i * space, wave[i]);
				if (i == (NUM_SAMPLES / 2) - 1)
				{
					ctx.lineTo(canvas.width,wave[i]);
				}
				else
				{
					ctx.lineTo((i + 1) * space, wave[i + 1]);
				}
				ctx.stroke();
				ctx.closePath();
				
				//Drawing
				if(ready)
				{
					ctx.beginPath();
					ctx.moveTo(lines[j], lines[j+1] + wave[i]);
					if(drawing)
					{
							lines[j+2] = mouseLoc.x;
							lines[j+3] = mouseLoc.y;
							ctx.lineTo(lines[j+2], lines[j+3] + wave[i+1]);
						
					}
					ctx.stroke();
					ctx.closePath();
				}
				
				if (circleBox) //circle
				{
					ctx.save();
					ctx.fillStyle = makeColor(Math.random().map(0,1,0,255),Math.random().map(0,1,0,255),Math.random().map(0,1,0,255));
					ctx.beginPath();
					ctx.arc(canvas.width/2, canvas.height/2, circleRadius * (data[i] / 15), 0, Math.PI * 2, false);
					ctx.fillStyle = makeColor(data[i],0,0,data[i].map(0,255,0,1));
					ctx.fill();
					ctx.closePath();
					ctx.restore();
				}
			}
			ctx.restore();
			
		}
		
		//Draws the top canvas
		function drawTop(data, wave){
			//Changing colors based off the lower frequencies
			var g = data[3];
			if(g==255){ctx2.strokeStyle = makeColor(255,0,0,0.3);}
			else if( g > 250) {ctx2.strokeStyle = makeColor(255, 128, 0, 0.3);}
			else if( g > 225){ctx2.strokeStyle = makeColor(255, 255, 0, 0.3);}
			else if( g > 215) {ctx2.strokeStyle = makeColor(0, 255, 0, 0.3);}
			else if( g > 200){ctx2.strokeStyle = makeColor(0, 255, 255, 0.3);}
			else if( g > 195) {ctx2.strokeStyle = makeColor(0, 0, 255, 0.3);}
			else if( g > 180) {ctx2.strokeStyle = makeColor(127, 0, 255, 0.3);}
			else {ctx2.strokeStyle = makeColor(0, 0, 0, 0.3);}
			
			ctx2.lineWidth = thickness;
			if (linesBox)
			{
				for(var i = 0; i < 3; i++){
					ctx2.beginPath();
					switch(style){
						case "one":
							ctx2.moveTo(canvas2.width/2, canvas2.height / 2);
							break;
						case "two":
							ctx2.moveTo(canvas2.width/2 + Math.cos(angle + (i*90)) * wave[i].map(180,255,0,600), canvas2.height / 2 + Math.sin(angle + (i*90)) * wave[i].map(180,255,0,600));
							break;
						case "three":
							ctx2.moveTo(canvas2.width/2 + Math.cos(angle + (i*90)) * data[i].map(180,255,0,600), canvas2.height / 2 + Math.sin(angle + (i*90)) * data[i].map(180,255,0,600));
							break;
						case "four":
							ctx2.moveTo(canvas2.width/2 + Math.cos(angle + (i*90)) * g, canvas2.height / 2 + Math.sin(angle + (i*90)) * g);
							break;
						default:
								break;
					}
					ctx2.lineTo(SCREEN_RADIUS * Math.cos(angle + (i*90)) + canvas2.width / 2, SCREEN_RADIUS * Math.sin(angle + (i*90)) + canvas2.height / 2);
					ctx2.stroke();
					ctx2.closePath();
				}
			}
			angle+= (1/70);
		}
		
		window.addEventListener("load",init);
 }());