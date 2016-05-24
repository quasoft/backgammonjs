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
  /**
   * Map of client sockets, indexed by socket ID
   * @type {{}}
   */
  this.clients = {};

  /**
   * List of all players
   * @type {Array}
   */
  this.players = [];

  /**
   * List of all games
   * @type {Array}
   */
  this.games = [];

  /**
   * Server's default config object
   * @type {{rulePath: string}}
   */
  this.config = {
    'rulePath': './rules/'
  };

  /**
   * Run server instance
   */
  this.run = function () {
    /** Reference to server instance */
    var self = this;

    app.get('/', function(req, res){
      res.sendFile(__dirname + '/client.html');
    });

    io.on('connection', function(socket){
      console.log('Client connected');

      self.clients[socket.id] = socket;

      socket.on('disconnect', function(){
        self.handleDisconnect(socket);
      });

      socket.on(comm.Message.CREATE_GUEST, function(params){
        self.handleRequest(comm.Message.CREATE_GUEST, socket, params);
      });

      socket.on(comm.Message.GET_GAME_LIST, function(params){
        self.handleRequest(comm.Message.GET_GAME_LIST, socket, params);
      });

      socket.on(comm.Message.CREATE_GAME, function(params){
        self.handleRequest(comm.Message.CREATE_GAME, socket, params);
      });

      socket.on(comm.Message.JOIN_GAME, function(params){
        self.handleRequest(comm.Message.JOIN_GAME, socket, params);
      });

      socket.on(comm.Message.START_GAME, function(params){
        self.handleRequest(comm.Message.START_GAME, socket, params);
      });

      socket.on(comm.Message.ROLL_DICE, function(params){
        self.handleRequest(comm.Message.ROLL_DICE, socket, params);
      });

      socket.on(comm.Message.MOVE_PIECE, function(params){
        self.handleRequest(comm.Message.MOVE_PIECE, socket, params);
      });

    });

    http.listen(comm.Protocol.Port, function(){
      console.log('listening on *:' + comm.Protocol.Port);
    });
  };

  /**
   * Send message to client's socket
   * @param {Socket} socket - Client's socket to send message to
   * @param {string} msg - Message ID
   * @param {Object} params - Object map with message parameters
   */
  this.sendMessage = function (socket, msg, params) {
    console.log('Sending message ' + msg + ' to client ' + socket.id);
    socket.emit(msg, params);
  };

  /**
   * Send message to player
   * @param {Player} player - Player to send message to
   * @param {string} msg - Message ID
   * @param {Object} params - Object map with message parameters
   */
  this.sendPlayerMessage = function (player, msg, params) {
    var socket = this.clients[player.socketID];
    this.sendMessage(socket, msg, params);
  };

  /**
   * Send message to all players in a game
   * @param {Game} game - Game, whose players to send message to
   * @param {string} msg - Message ID
   * @param {Object} params - Object map with message parameters
   */
  this.sendGameMessage = function (game, msg, params) {
    for (var i = 0; i < game.players.length; i++) {
      this.sendPlayerMessage(game.players[i], msg, params);
    }
  };

  /**
   * Send message to other players in the game, except the specified one
   * @param {Game} game - Game, whose players to send message to
   * @param {number} exceptPlayerID - Do not send message to this player
   * @param {string} msg - Message ID
   * @param {Object} params - Object map with message parameters
   */
  this.sendOthersMessage = function (game, exceptPlayerID, msg, params) {
    for (var i = 0; i < game.players.length; i++) {
      if (game.players[i].id === exceptPlayerID) {
        continue;
      }
      this.sendPlayerMessage(game.players[i], msg, params);
    }
  };

  /**
   * Handle client disconnect
   * @param {Socket} socket - Client socket
   */
  this.handleDisconnect = function (socket) {
    console.log('Client disconnected');
  };

  /**
   * Handle client's request
   * @param {string} msg - Message ID
   * @param {Socket} socket - Client socket
   * @param {Object} params - Message parameters
   */
  this.handleRequest = function (msg, socket, params) {
    console.log('Request received: ' + msg);

    var reply = {
      'result': false
    };

    if (msg === comm.Message.CREATE_GUEST) {
      reply.result = this.handleCreateGuest(socket, params, reply);
    }
    else if (msg === comm.Message.GET_GAME_LIST) {
      reply.result = this.handleGetGameList(socket, params, reply);
    }
    else if (msg === comm.Message.CREATE_GAME) {
      reply.result = this.handleCreateGame(socket, params, reply);
    }
    else if (msg === comm.Message.JOIN_GAME) {
      reply.result = this.handleJoinGame(socket, params, reply);
    }
    else if (msg === comm.Message.START_GAME) {
      reply.result = this.handleStartGame(socket, params, reply);
    }
    else if (msg === comm.Message.ROLL_DICE) {
      reply.result = this.handleRollDice(socket, params, reply);
    }
    else if (msg === comm.Message.MOVE_PIECE) {
      reply.result = this.handleMovePiece(socket, params, reply);
    }
    else {
      console.log('Unknown message!');
      return;
    }

    if (socket['game'] != null) {
      reply.game = socket['game'];
    }

    if (reply['errorMessage'] != null) {
      console.log(reply['errorMessage']);
    }

    this.sendMessage(socket, msg, reply);
  };

  /**
   * Handle client's request to login as guest player.
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleCreateGuest = function (socket, params, reply) {
    console.log('Creating guest player');

    var player = model.Player.createNew();
    player.name = 'Player ' + player.id;

    this.players.push(player);

    player.socketID = socket.id;
    socket['player'] = player;

    reply.player = player;

    return true;
  };

  /**
   * Handle client's request to get list of active games
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleGetGameList = function (socket, params, reply) {
    console.log('List of games requested');

    var list = [];

    for (var i = 0; i < this.games.length; i++) {
      list.push({
        'id': this.games[i].id
      });
    }

    reply.list = list;

    return true;
  };

  /**
   * Handle client's request to create a new game
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleCreateGame = function (socket, params, reply) {
    console.log('Creating new game', params);

    var player = socket['player'];
    if (player == null) {
        reply.errorMessage = 'Player not found!';
        return false;
    }

    var rule = model.Utils.loadRule(this.config.rulePath, params.ruleName);

    var game = model.Game.createNew(rule);
    model.Game.addHostPlayer(game, player);
    player.currentGame = game.id;
    player.pieceType = model.PieceType.WHITE;
    this.games.push(game);

    socket['game'] = game;
    socket['rule'] = rule;

    reply.player = player;
    reply.ruleName = params.ruleName;

    return true;
  };

  /**
   * Handle client's request to join a new game
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleJoinGame = function (socket, params, reply) {
    console.log('Joining game', params);

    if (this.games.length <= 0) {
      reply.errorMessage = 'Game with ID ' + params.gameID + ' not found!';
      return false;
    }
    var game = this.games[this.games.length - 1];
    /*
    var game = this.getGameByID(params.gameID);
    if (!game) {
      reply.errorMessage = 'Game with ID ' + params.gameID + ' not found!';
      return false;
    }
    */

    if (game.guest != null) {
      reply.errorMessage = 'Game with ID ' + game.id + ' is full!';
      return false;
    }

    var guestPlayer = socket['player'];
    if (guestPlayer == null) {
      reply.errorMessage = 'Player not found!';
      return false;
    }

    model.Game.addGuestPlayer(game, guestPlayer);

    guestPlayer.currentGame = game.id;
    guestPlayer.pieceType = model.PieceType.BLACK;

    socket['game'] = game;

    reply.ruleName = game.ruleName;

    this.sendOthersMessage(
      game,
      guestPlayer.id,
      comm.Message.EVENT_PLAYER_JOINED,
      {
        'game': game,
        'guest': guestPlayer
      }
    );

    return true;
  };

  /**
   * Handle client's request to start the game.
   * The game is started, only if another player has joined the game
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleStartGame = function (socket, params, reply) {
    console.log('Starting game');

    var game = socket['game'];
    var player = socket['player'];

    if ((game.host == null) || (game.host.id != player.id)) {
      reply.errorMessage = 'Game with ID ' + game.id + ' not owned by player with ID ' + player.id + '!';
      return false;
    }

    if (!model.Game.hasGuestJoined(game)) {
      reply.errorMessage = 'Game with ID ' + game.id + ' has no guest player!';
      return false;
    }

    game.hasStarted = true;
    game.turnPlayer = socket['player'];

    this.sendOthersMessage(
      game,
      player.id,
      comm.Message.EVENT_GAME_START,
      {
        'game': game
      }
    );

    return true;
  };

  /**
   * Handle client's request to roll dice.
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleRollDice = function (socket, params, reply) {
    console.log('Rolling dice');

    var game = socket['game'];
    var player = socket['player'];
    var rule = socket['rule'];

    if (!game.hasStarted) {
      reply.errorMessage = 'Game with ID ' + game.id + ' is not yet started!';
      return false;
    }

    if ((game.turnPlayer == null) || (game.turnPlayer.id != player.id)) {
      reply.errorMessage = 'Cannot roll dice it isn\'t player ' + player.id + ' turn!';
      return false;
    }

    if (model.Game.diceWasRolled(game)) {
      reply.errorMessage = 'Dice was already rolled!';
      return false;
    }

    var dice = rule.rollDice();

    game.turnDice = dice;

    reply.player = game.turnPlayer;
    reply.dice = dice;

    this.sendOthersMessage(
      game,
      player.id,
      comm.Message.EVENT_DICE_ROLL,
      {
        'game': game
      }
    );

    return true;
  };

  /**
   * Handle client's request to move a piece.
   * @param {Socket} socket - Client socketq
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleMovePiece = function (socket, params, reply) {
    console.log('Moving a piece');

    var game = socket['game'];
    var player = socket['player'];
    var rule = socket['rule'];

    if (player.pieceType != params.type) {
      reply.errorMessage = 'Player cannot move ' + params.type + ' pieces!';
      return false;
    }

    if (!rule.validateMove(game, params.position, params.type, params.steps)) {
      reply.errorMessage = 'Requested move is not valid!';
      return false;
    }

    rule.moveBy(game, params.position, params.type, params.steps);

    this.sendOthersMessage(
      game,
      player.id,
      comm.Message.EVENT_PIECE_MOVE,
      {
        'game': game,
        'position': params.position,
        'type': params.type,
        'steps': params.steps
      }
    );

    return true;
  };

  /**
   * Get player by ID
   * @param {number} id - Player's ID
   * @returns {Player} - Returns player or null if not found.
   */
  this.getPlayerByID = function (id) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].id === id) {
        return this.players[i];
      }
    }
    return null;
  };

  /**
   * Get game by ID
   * @param {number} id - Game ID
   * @returns {Game} - Returns game or null if not found.
   */
  this.getGameByID = function (id) {
    for (var i = 0; i < this.games.length; i++) {
      if (this.games[i].id === id) {
        return this.games[i];
      }
    }
    return null;
  };

}

var server = new Server();
var db = null;

mongo.connect('mongodb://127.0.0.1:27017/backgammon', function(err, database) {
  if(err) throw err;

  db = database;

  // Start server if connected to database
  server.run();
});
