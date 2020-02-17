let express = require('express');
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let path = require('path');


app.use("/Client", express.static("Client"));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/Client/index.html'));
});
app.get('/chatStyle.css', function(req, res) {
  res.sendFile(path.join(__dirname + '/Client/chatStyle.css'));
});
app.get('/chatScript.js', function(req, res) {
  res.sendFile(path.join(__dirname + '/Client/chatScript.js'));
});

io.on("connection", function(socket){
  console.log("user has connected");
  io.on("disconnect", function(socket){
    console.log("User has disconnected");
  });
  socket.on("chat message", function(msg){
    io.emit("chat message", msg);
    console.log(msg);
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
