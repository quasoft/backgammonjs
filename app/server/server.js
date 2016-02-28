var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var comm = require('../../lib/comm.js');

var msgQueue = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    console.log('message: ' + msg);

    io.emit('chat message', msg);
  });

  socket.on(comm.Message.GET_GAME_LIST, function(){
    console.log('getGameList');

    io.emit('getGameList', 'msg');
  });
});

http.listen(comm.Protocol.Port, function(){
  console.log('listening on *:' + comm.Protocol.Port);
});
