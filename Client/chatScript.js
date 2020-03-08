"use strict"
let socket = io();
$(document).ready(function(){

  //users current nickname
  let username;
  //user's current color for their nickname (will start as black)
  let nickcolor = "000000";

  //TODO: check if message is empty before sending
  //sending message with the send button is clicked
  $("#send").click(function(){
    handleInput();
  });

  //can send message with enter key
  $("#input").keypress(function(event){
    let keyCode = event.key;
    if(keyCode == 'Enter'){
      handleInput();
    }
  });

  function isHexColor(hex){
    if(hex.length===6){
      if(!isNaN(Number('0x' + hex))){
        return true;
      }
    }
    return false;
  }

  function handleInput(){
    let message = {
      text: $('#input').val(),
      nickname: username,
      usercolor: nickcolor
    }
    //don't send the message if the content is empty
    if(message.text === ""){
      return;
    }
    //checking if user is sending a command
    if(message.text[0] === "/"){
      //change nickname message
      if(message.text.startsWith("/nick ")){
        message.text = message.text.slice(6, message.text.length);
        let nameData = {
          newName: message.text,
          oldName: username
        };
        socket.emit("change name", nameData);
      }
      else if(message.text.startsWith("/nickcolor ")){
        let color = message.text.slice(11, message.text.length);
        if(isHexColor(color)){
          nickcolor = color;
          $("#messages").prepend($("<li class='warning'>").html("<b><i>**Succesfully changed color to: <span style='color:#"+color+"'>"+username+"</span></i></b>"));
          let height = $("#messages")[0].scrollHeight;
          $("#messages").scrollTop(height);
        }
        else{
          $("#messages").prepend($("<li class='warning'>").html("<b><i>**Must input a hex color</i></b>"));
          let height = $("#messages")[0].scrollHeight;
          $("#messages").scrollTop(height);
        }
      }
      else{
          $("#messages").prepend($("<li class='warning'>").html("<b><i>**invalid command, accepted commands: /nick new name, /nickcolor hex color</i></b>"));
          let height = $("#messages")[0].scrollHeight;
          $("#messages").scrollTop(height);
      }
    }
    else{
      socket.emit("chat message", message);
    }
    $("#input").val("");
  }

  //receiving a message from the server
  socket.on("chat message", function(msg){
    let currentDate = new Date(msg.time);
    let minutes = currentDate.getMinutes();
    if(minutes < 10){
      minutes = "0"+minutes;
    }
    let currentTime = currentDate.getHours() + ":" + minutes;
    $("#messages").prepend($("<li class='otherMess'>").html("<span class='info'>"+currentTime + " <span style='color:#"+msg.usercolor+"'>" + msg.user + "</span>: </span><br><span class='other'>" + msg.text+"</span>"));
    let height = $("#messages")[0].scrollHeight;
    $("#messages").scrollTop(height);
  });

  socket.on("own message", function(msg){
    let currentDate = new Date(msg.time);
    let minutes = currentDate.getMinutes();
    if(minutes < 10){
      minutes = "0"+minutes;
    }
    let currentTime = currentDate.getHours() + ":" + minutes;
    $("#messages").prepend($("<li class='ownMess'>").html("<b><span class='info'>:" + "<span style='color:#"+msg.usercolor+"'>" + msg.user + " </span>"+currentTime+"</span><br> <span class='own'>" + msg.text+"</span>" + "</b>"));
    let height = $("#messages")[0].scrollHeight;
    $("#messages").scrollTop(height);
  });

  socket.on("initial", function(msg){
    console.log("connected");
    for(let message of msg.chat){
      let currentDate = new Date(message.time);
      let minutes = currentDate.getMinutes();
      if(minutes < 10){
        minutes = "0"+minutes;
      }
      let currentTime = currentDate.getHours() + ":" + minutes;
      $("#messages").prepend($("<li class='otherMess'>").html("<span class='info'>"+currentTime + " <span style='color:#"+message.usercolor+"'>" + message.user + "</span>:</span><br> <span class='other'>" + message.text+"</span>"));
    }
    let height = $("#messages")[0].scrollHeight;
    $("#messages").scrollTop(height);
    for(let user of msg.users){
      $("#users").prepend($("<li>").html("<b>"+user.nick+"</b>"));
    }
    let userheight = $("#users")[0].scrollHeight;
    $("#users").scrollTop(userheight);
  });

  socket.on("name", function(givenName){
    username = givenName;
    $("#nickname").text("You are: " + username);
    document.cookie = "user="+username;
  });

  socket.on("user add", function(name){
    $("#users").prepend($("<li>").html("<b>"+name+"</b>"));
    let userheight = $("#users")[0].scrollHeight;
    $("#users").scrollTop(userheight);
  });

  socket.on("user del", function(name){
    $("#users>li").remove(":contains('"+name+"')");
    let userheight = $("#users")[0].scrollHeight;
    $("#users").scrollTop(userheight);
  });

  socket.on("name change fail", function(name){
    $("#messages").prepend($("<li class='warning'>").html("<b><i>**" + name + " is already taken, please chose another name</i></b>"));
    let height = $("#messages")[0].scrollHeight;
    $("#messages").scrollTop(height);
  });

  socket.on("name change success", function(name){
    $("#messages").prepend($("<li class='warning'>").html("<b><i>**" + "Changed name to: " + name+"</i></b>"));
    let height = $("#messages")[0].scrollHeight;
    $("#messages").scrollTop(height);
    username = name;
    $("#nickname").text("You are: " + username);
    document.cookie = "user="+username;
  });


});
