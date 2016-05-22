var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var comm = require('../../lib/comm.js');
var model = require('../../lib/model.js');
var mongo = require('mongodb').MongoClient;
require('../../lib/rules/rule.js');
require('../../lib/rules/RuleBgCasual.js');
require('../../lib/rules/RuleBgGulbara.js');

/**
 * Backgammon client
 * @constructor
 */
function Server() {
  this.clients = {};
  this.msgQueue = [];
  this.players = [];
  this.games = [];

  this.config = {
    'rulePath': './rules/'
  };

  this.run = function () {
    var self = this;

    //db.collection('test').insert({hello2: 'world2'});

    app.get('/', function(req, res){
      res.sendFile(__dirname + '/client.html');
    });

    io.on('connection', function(socket){
      console.log('Client connected');

      self.clients[socket.id] = socket;

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

      socket.on(comm.Message.START_GAME, function(params){
        self.handleStartGame(socket);
      });

      socket.on(comm.Message.ROLL_DICE, function(params){
        self.handleRollDice(socket, params);
      });
    });

    http.listen(comm.Protocol.Port, function(){
      console.log('listening on *:' + comm.Protocol.Port);
    });
  };

  /**
   * Send message to client's socket
   * @param {io.Socket} Client socket to send message to
   * @param {string} Message ID
   * @param {object} Object map with message parameters
   */
  this.sendMessage = function (socket, msg, params) {
    console.log('Sending message ' + msg + ' to client ' + socket.id);
    socket.emit(msg, params);
  };

  /**
   * Send message to player
   * @param {Backgammon.Player} Player to send message to
   * @param {string} Message ID
   * @param {object} Object map with message parameters
   */
  this.sendPlayerMessage = function (player, msg, params) {
    var socket = this.clients[player.socketID];
    this.sendMessage(socket, msg, params);
  };

  /**
   * Send message to all players in a game
   * @param {Backgammon.Game} Game, whose players to send message to
   * @param {string} Message ID
   * @param {object} Object map with message parameters
   */
  this.sendGameMessage = function (game, msg, params) {
    for (var i = 0; i < game.players.length; i++) {
      this.sendPlayerMessage(game.players[i], msg, params);
    }
  };

  /**
   * Send message to other players in the game, except the specified one
   * @param {Backgammon.Game} Game, whose players to send message to
   * @param {string} Message ID
   * @param {object} Object map with message parameters
   */
  this.sendOthersMessage = function (game, exceptPlayerID, msg, params) {
    for (var i = 0; i < game.players.length; i++) {
      if (game.players[i].id == exceptPlayerID) {
        continue;
      }
      this.sendPlayerMessage(game.players[i], msg, params);
    }
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
    player.name = 'Player ' + player.id;

    this.players.push(player);

    player.socketID = socket.id;
    socket['player'] = player;

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

    var player = socket['player'];
    if (!player) {
        console.log('Player not found!');
        return;
    }

    var rule = model.Utils.loadRule(this.config.rulePath, params.ruleName);

    var game = model.Game.createNew(rule);
    model.Game.addHostPlayer(game, player);
    player.currentGame = game.id;
    this.games.push(game);

    socket['game'] = game;
    socket['rule'] = rule;

    this.sendPlayerMessage(
      player,
      comm.Message.CREATE_GAME,
      {
        'result': true,
        'game': game,
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
      return;
    }

    var guestPlayer = socket['player'];
    if (!guestPlayer) {
      console.log('Player not found!');
      return;
    }

    model.Game.addGuestPlayer(game, guestPlayer);

    guestPlayer.currentGame = game.id;

    socket['game'] = game;

    this.sendPlayerMessage(
      guestPlayer,
      comm.Message.JOIN_GAME,
      {
        'result': true,
        'game': game,
        'ruleName': game.ruleName
      }
    );

    this.sendOthersMessage(
      game,
      guestPlayer.id,
      comm.Message.EVENT_PLAYER_JOINED,
      {
        'player': guestPlayer
      }
    );

  };

  /**
   * Handle client's request to start the game.
   * The game is started, only if another player has joined the game
   * @param {io.Socket} Client socket
   */
  this.handleStartGame = function (socket) {
    console.log('Starting game');

    var game = socket['game'];
    var player = socket['player'];

    if ((!game.host) || (game.host.id != player.id)) {
      console.log('Game with ID ' + game.id + ' not owned by player with ID ' + player.id + '!');
      return;
    }

    if (!model.Game.hasGuestJoined(game)) {
      console.log('Game with ID ' + game.id + ' has no guest player!');
      return;
    }

    game.hasStarted = true;
    game.turnPlayer = socket['player'];

    this.sendGameMessage(
      game,
      comm.Message.START_GAME,
      {
        'result' : true,
        'game': game
      }
    );

  };

  /**
   * Handle client's request to roll dice.
   * @param {io.Socket} Client socket
   */
  this.handleRollDice = function (socket) {
    console.log('Rolling dice');

    var game = socket['game'];
    var player = socket['player'];
    var rule = socket['rule'];

    if (!game.hasStarted) {
      console.log('Game with ID ' + game.id + ' is not yet started!');
      return;
    }

    if ((game.turnPlayer == null) || (game.turnPlayer.id != player.id)) {
      console.log('Cannot roll dice it isn\'t player ' + player.id + ' turn!');
      return;
    }

    if (model.Game.diceWasRolled(game)) {
      console.log('Dice was already rolled!');
      return;
    }

    var dice = rule.rollDice();

    // Send dice to all players
    this.sendGameMessage(
      game,
      comm.Message.ROLL_DICE,
      {
        'player': game.turnPlayer,
        'dice' : dice
      }
    );

  }

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

mongo.connect('mongodb://127.0.0.1:27017/backgammon', function(err, database) {
  if(err) throw err;

  db = database;

  // Start server if connected to database
  server.run();
});
