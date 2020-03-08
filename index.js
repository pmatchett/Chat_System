"use strict";
let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let path = require('path');
let cookie = require("cookie");

let msgLog = initLog();
let users = initNicks();


app.use("/Client", express.static("Client"));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/Client/index.html'));
});


io.on("connection", function(socket){
  let userId = socket.id;
  console.log("user has connected "+ userId);

  //sending the message log to a new connection
  let info = {
    chat:msgLog.getLog(),
    users:users.getNames()
  }
  socket.emit("initial", info);
  //checking if there is a cookie from a previous connection
  let cookies
  if(socket.handshake.headers.cookie !== undefined){
    cookies = cookie.parse(socket.handshake.headers.cookie);
  }
  if(cookies!==undefined && cookies.user !== undefined){
    if(users.checkDuplicate(cookies.user)){
      socket.emit("name", users.generateName(userId));
    }
    else{
      socket.emit("name", cookies.user);
      users.addNick(cookies.user, userId);
    }
  }
  else{
    socket.emit("name", users.generateName(userId));
  }
  socket.on("disconnect", function(socket){
    console.log("User has disconnected "+userId);
    users.removeNameId(userId);
  });
  socket.on("chat message", function(msg){
    let currentTime = Date.now();
    let username = msg.nickname;
    let content = msg.text;
    let color = msg.usercolor;
    let message = {
      time: currentTime,
      user: username,
      text: content,
      usercolor: color
    };
    msgLog.addMsg(message);
    socket.broadcast.emit("chat message", message);
    socket.emit("own message", message);
  });
  socket.on("change name", function(name){
    if(users.changeName(name.newName, name.oldName, userId) === false){
      socket.emit("name change fail", name.newName);
    }
    else{
      socket.emit("name change success", name.newName);
    }
  });
});

//setting up the chat log
//Might try to find a vector to optimize (currently no limit to chat log length, might want to chance that)
//currently this method requires the chat log to be global, might have to look into this
function initLog(){
  let chatLog = [];
  let index = 0;
  function addMsg(message){
    chatLog[index] = message;
    index++;
  }
  function getLog(){
    return chatLog;
  }
  return {addMsg, getLog};
}

//initialising the list of users, currently all users are kept on the list
//Similar to log this method leaves a global variable
function initNicks(){
  let nicknames = [];
  let index = 0;
  let users = 0;
  function addNick(name, socket){
    nicknames[index] = {
      nick: name,
      id: socket
    };
    index++;
    io.emit("user add", name);
  }
  function generateName(socket){
    let newName = "User" + users;
    addNick(newName, socket);
    users++;
    return newName;
  }
  function removeName(name){
    for(let tempIndex in nicknames){
      if(nicknames[tempIndex].nick === name){
        nicknames.splice(tempIndex, 1);
        index--;
      }
    }
    io.emit("user del", name);
  }
  function removeNameId(id){
    let name;
    for(let tempIndex in nicknames){
      if(nicknames[tempIndex].id === id){
        name = nicknames[tempIndex].nick;
        nicknames.splice(tempIndex, 1);
        index--;
      }
    }
    io.emit("user del", name);
  }
  function changeName(newName, oldName, socket){
    if(checkDuplicate(newName)){
      return false;
    }
    addNick(newName, socket);
    removeName(oldName);
    return true;
  }
  function getNames(){
    return nicknames
  }
  function checkDuplicate(name){
    for(let tempIndex in nicknames){
      if(nicknames[tempIndex].nick.toLowerCase() === name.toLowerCase()){
        return true;
      }
    }
    return false;
  }
  return {addNick, generateName, getNames, removeName, removeNameId, changeName, checkDuplicate};
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});
