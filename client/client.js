"use strict";

$(document).ready(function() {
	//Logs error and puts on-screen
    function handleError(message) {
        console.log(message);
		document.querySelector('#error').innerHTML = message;
    }
    
	//Handles Ajax call
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
            error: function(xhr, status, error) {	//If an error occurs, call handler
                var messageObj = JSON.parse(xhr.responseText);
                handleError(messageObj.error);
            }
        });
    }
    
	//Checks for valid input in Signup form, then triggers Ajax call
    $("#signupSubmit").on("click", function(e) {
        e.preventDefault();
    
        if($("#user").val() == '' || $("#pass").val() == '' || $("#pass2").val() == '') {
            handleError("Error! All fields are required");
            return false;
        }
        if($("#pass").val() !== $("#pass2").val()) {
            handleError("Error! Passwords do not match");
            return false;           
        }

        sendAjax($("#signupForm").attr("action"), $("#signupForm").serialize());
        
        return false;
    });

	//Checks for valid input in Login form, then triggers Ajax call
    $("#loginSubmit").on("click", function(e) {
        e.preventDefault();
    
        if($("#user").val() == '' || $("#pass").val() == '') {
            handleError("Error! Username or password is empty");
            return false;
        }
    
        sendAjax($("#loginForm").attr("action"), $("#loginForm").serialize());

        return false;
    });
});