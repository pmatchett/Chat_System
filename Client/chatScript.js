let socket = io();
$(document).ready(function(){
  $("#send").click(function(){
    socket.emit("chat message", $('#m').val());
    $("#m").val("");
  });
  socket.on("chat message", function(msg){
    $("#messages").append($("<li>").text(msg));
  });
  //can send message with enter key
  $("#m").keypress(function(event){
    let keyCode = event.key;
    if(keyCode == 'Enter'){
      socket.emit("chat message", $('#m').val());
      $("#m").val("");
    }
  });
});
