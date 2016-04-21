"use strict";

$(document).ready(function() {

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
        if($("#songTitle").val() == '' || $("#songArtist").val() == '') {
            handleError("Error! All fields are required!");
            return false;
        }
        sendAjax($("#songForm").attr("action"), $("#songForm").serialize());
        
        return false;
    });
    
});