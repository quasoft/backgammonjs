var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var comm = require('../../lib/comm.js');
var model = require('../../lib/model.js');
require('../../lib/rules/rule.js');
require('../../lib/rules/RuleBgCasual.js');
require('../../lib/rules/RuleBgGulbara.js');

/**
 * Backgammon client
 * @constructor
 */
function Server() {
  this.clients = [];
  this.msgQueue = [];
  this.players = [];
  this.games = [];

  this.config = {
    'rulePath': './rules/'
  };

  this.run = function () {
    var self = this;

    app.get('/', function(req, res){
      res.sendFile(__dirname + '/client.html');
    });

    io.on('connection', function(socket){
      console.log('Client connected');

      self.clients.push(socket);

      socket.on('disconnect', function(){
        self.handleDisconnect(socket);
      });

      socket.on(comm.Message.CREATE_GUEST, function(){
        self.handleCreateGuest(socket);
      });

      socket.on(comm.Message.GET_GAME_LIST, function(){
        self.handleGetGameList(socket);
      });

      socket.on(comm.Message.CREATE_GAME, function(params){
        self.handleCreateGame(socket, params);
      });

      socket.on(comm.Message.JOIN_GAME, function(params){
        self.handleJoinGame(socket, params);
      });
    });

    http.listen(comm.Protocol.Port, function(){
      console.log('listening on *:' + comm.Protocol.Port);
    });
  };

  /**
   * Send message to client
   * @param {io.Socket} Client socket to send message to
   * @param {string} Message ID
   * @param {object} Object map with message parameters
   */
  this.sendMessage = function (socket, msg, params) {
    console.log('Sending message ' + msg + ' to client ' + socket.id);
    socket.emit(msg, params);
  };

  /**
   * Handle client disconnect
   * @param {io.Socket} Client socket
   */
  this.handleDisconnect = function (socket) {
    console.log('Client disconnected');
  };

  /**
   * Handle client's request to login as guest player
   * @param {io.Socket} Client socket
   */
  this.handleCreateGuest = function (socket) {
    console.log('Creating guest player');

    var player = model.Player.createNew();

    this.players.push(player);

    this.sendMessage(socket, comm.Message.CREATE_GUEST, player);
  };

  /**
   * Handle client's request to get lits of active games
   * @param {io.Socket} Client socket
   */
  this.handleGetGameList = function (socket) {
    console.log('List of games requested');

    var list = [];

    for (var i = 0; i < this.games.length; i++) {
      list.push({
        'id': this.games[i].id
      });
    }

    this.sendMessage(socket, comm.Message.GET_GAME_LIST, list);
  };

  /**
   * Handle client's request to create a new game
   * @param {io.Socket} Client socket
   */
  this.handleCreateGame = function (socket, params) {
    console.log('Creating new game', params);

    var player = this.getPlayerByID(params.playerID);
    if (!player) {
        console.log('Player with ID ' + params.playerID + ' not found!');
        this.sendMessage(socket, comm.Message.CREATE_GAME, null);
        return;
    }

    var rule = model.Utils.loadRule(this.config.rulePath, params.ruleName);
    var game = model.Game.createNew(rule);
    game.addHostPlayer(player);
    player.currentGame = game.id;
    this.games.push(game);

    this.sendMessage(
      socket,
      comm.Message.CREATE_GAME,
      {
        'playerID': params.playerID,
        'gameID': game.id,
        'ruleName': params.ruleName
      }
    );
  };

  /**
   * Handle client's request to join a new game
   * @param {io.Socket} Client socket
   */
  this.handleJoinGame = function (socket, params) {
    console.log('Joining game', params);

    if (this.games.length <= 0) {
      console.log('Game with ID ' + params.gameID + ' not found!');
      this.sendMessage(socket, comm.Message.JOIN_GAME, null);
      return;
    }
    var game = this.games[this.games.length - 1];
    /*
    var game = this.getGameByID(params.gameID);
    if (!game) {
      console.log('Game with ID ' + params.gameID + ' not found!');
      this.sendMessage(socket, comm.Message.JOIN_GAME, null);
      return;
    }
    */

    if (game.guest) {
      console.log('Game with ID ' + game.id + ' is full!');
      this.sendMessage(socket, comm.Message.JOIN_GAME, null);
      return;
    }

    var guestPlayer = this.getPlayerByID(params.playerID);
    if (!guestPlayer) {
      console.log('Player with ID ' + params.playerID + ' not found!');
      this.sendMessage(socket, comm.Message.JOIN_GAME, null);
      return;
    }
    game.addGuestPlayer(guestPlayer);

    guestPlayer.currentGame = game.id;

    this.sendMessage(
      socket,
      comm.Message.JOIN_GAME,
      {
        'hostPlayerID': game.host.id,
        'gameID': game.id,
        'ruleName': game.rule.constructor.name
      }
    );
  };

  this.getPlayerByID = function (id) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].id == id) {
        return this.players[i];
      }
    }
    return null;
  };

  this.getGameByID = function (id) {
    for (var i = 0; i < this.games.length; i++) {
      if (this.games[i].id == id) {
        return this.games[i];
      }
    }
    return null;
  };

};

var server = new Server();
server.run();
