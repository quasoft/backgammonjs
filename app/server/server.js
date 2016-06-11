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
 * Backgammon server.
 * Listens to socket for command messages and processes them.
 * The server is responsible for management of game and player objects,
 * rolling dice and validation of moves.
 *
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
   * @type {Player[]}
   */
  this.players = [];

  /**
   * List of all games
   * @type {Game[]}
   */
  this.games = [];
  
  /**
   * List of players waiting for starting a random queue
   * @type {Player[]}
   */
  this.randomPlayerQueue = [];

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
      
      socket.on(comm.Message.PLAY_RANDOM, function(params){
        self.handleRequest(comm.Message.PLAY_RANDOM, socket, params);
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

      socket.on(comm.Message.CONFIRM_MOVES, function(params){
        self.handleRequest(comm.Message.CONFIRM_MOVES, socket, params);
      });

    });

    http.listen(comm.Protocol.Port, function(){
      console.log('listening on *:' + comm.Protocol.Port);
    });
  };

  /**
   * Get game object associated with a socket
   * @param {Socket} socket - Client's socket
   * @returns {Game} - Game object associated with this socket
   */
  this.getSocketGame = function (socket) {
    return socket['game'];
  };

  /**
   * Get game object associated with a socket
   * @param {Socket} socket - Client's socket
   * @returns {Player} - Player object associated with this socket
   */
  this.getSocketPlayer = function (socket) {
    return socket['player'];
  };

  /**
   * Get game object associated with a socket
   * @param {Socket} socket - Client's socket
   * @returns {Rule} - Rule object associated with this socket
   */
  this.getSocketRule = function (socket) {
    return socket['rule'];
  };

  /**
   * Associate game object with socket
   * @param {Socket} socket - Client's socket
   * @param {Game} game - Game object to associate
   */
  this.setSocketGame = function (socket, game) {
    socket['game'] = game;
  };

  /**
   * Associate player object with socket
   * @param {Socket} socket - Client's socket
   * @param {Player} player - Player object to associate
   */
  this.setSocketPlayer = function (socket, player) {
    socket['player'] = player;
  };

  /**
   * Associate player object with socket
   * @param {Socket} socket - Client's socket
   * @param {Rule} rule - Rule object to associate
   */
  this.setSocketRule = function (socket, rule) {
    socket['rule'] = rule;
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
    
    // Return client's sequence number back. Client uses this number
    // to find the right callback that should be executed on message reply.
    if (params.clientMsgSeq) {
      reply.clientMsgSeq = params.clientMsgSeq;
    }

    if (msg === comm.Message.CREATE_GUEST) {
      reply.result = this.handleCreateGuest(socket, params, reply);
    }
    else if (msg === comm.Message.GET_GAME_LIST) {
      reply.result = this.handleGetGameList(socket, params, reply);
    }
    else if (msg === comm.Message.PLAY_RANDOM) {
      reply.result = this.handlePlayRandom(socket, params, reply);
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
    else if (msg === comm.Message.CONFIRM_MOVES) {
      reply.result = this.handleConfirmMoves(socket, params, reply);
    }
    else {
      console.log('Unknown message!');
      return;
    }

    var game = this.getSocketGame(socket);
    if (game != null) {
      reply.game = game;
    }

    if (reply.errorMessage) {
      console.log(reply.errorMessage);
    }

    // First send reply
    this.sendMessage(socket, msg, reply);
    
    // After that execute provided sendAfter callback. The callback
    // allows any additional events to be sent after the reply
    // has been sent.
    if (reply.sendAfter)
    {
      // Execute provided callback
      reply.sendAfter();
      
      // Remove it from reply, it does not need to be sent to client
      delete reply.sendAfter;
    }
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
    this.setSocketPlayer(socket, player);

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
   * Handle client's request to play a random game.
   * If there is another player waiting in queue, start a game
   * between the two players. If there are no other players
   * waiting, put player in queue.
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {string} params.ruleName - Name of rule that should be used for creating the game
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handlePlayRandom = function (socket, params, reply) {
    console.log('Play random game');
    
    var player = this.getSocketPlayer(socket);
    if (player == null) {
        reply.errorMessage = 'Player not found!';
        return false;
    }

    var otherPlayer = this.randomPlayerQueue.pop();
    if (otherPlayer != null) {
      // Start a new game with this other player
      var rule = model.Utils.loadRule(this.config.rulePath, params.ruleName);
      var game = model.Game.createNew(rule);
      
      otherPlayer.currentGame = game.id;
      otherPlayer.currentPieceType = model.PieceType.WHITE;
      model.Game.addHostPlayer(game, otherPlayer);
      
      player.currentGame = game.id;
      player.currentPieceType = model.PieceType.BLACK;
      model.Game.addGuestPlayer(game, player);
      
      game.hasStarted = true;
      game.turnPlayer = otherPlayer;
      
      this.games.push(game);

      // Assign game and rule objects to sockets of both players
      this.setSocketGame(socket, game);
      this.setSocketRule(socket, rule);
      
      var otherSocket = this.clients[otherPlayer.socketID];
      this.setSocketGame(otherSocket, game);
      this.setSocketRule(otherSocket, rule);
      
      // Remove players from waiting queue
      model.Utils.removeItem(this.randomPlayerQueue, player);
      model.Utils.removeItem(this.randomPlayerQueue, otherPlayer);

      // Prepare reply
      reply.host = otherPlayer;
      reply.guest = player;
      reply.ruleName = params.ruleName;
      
      var self = this;
      reply.sendAfter = function () {
        self.sendGameMessage(
          game,
          comm.Message.EVENT_RANDOM_GAME_START,
          {
            'game': game
          }
        );
      };
      
      return true;
    }
    else {
      // Put player in queue, and wait for another player
      this.randomPlayerQueue.push(player);
      
      reply.isWaiting = true;
      return true;
    }
  };

  /**
   * Handle client's request to create a new game
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {string} params.ruleName - Name of rule that should be used for creating the game
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleCreateGame = function (socket, params, reply) {
    console.log('Creating new game', params);

    var player = this.getSocketPlayer(socket);
    if (player == null) {
        reply.errorMessage = 'Player not found!';
        return false;
    }

    var rule = model.Utils.loadRule(this.config.rulePath, params.ruleName);

    var game = model.Game.createNew(rule);
    model.Game.addHostPlayer(game, player);
    player.currentGame = game.id;
    player.currentPieceType = model.PieceType.WHITE;
    this.games.push(game);

    this.setSocketGame(socket, game);
    this.setSocketRule(socket, rule);

    reply.player = player;
    reply.ruleName = params.ruleName;

    return true;
  };

  /**
   * Handle client's request to join a new game
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {string} params.gameID - ID of game to join
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

    var guestPlayer = this.getSocketPlayer(socket);
    if (guestPlayer == null) {
      reply.errorMessage = 'Player not found!';
      return false;
    }

    var rule = model.Utils.loadRule(this.config.rulePath, game.ruleName);

    model.Game.addGuestPlayer(game, guestPlayer);

    guestPlayer.currentGame = game.id;
    guestPlayer.currentPieceType = model.PieceType.BLACK;

    this.setSocketGame(socket, game);
    this.setSocketRule(socket, rule);

    reply.ruleName = game.ruleName;
    reply.host = game.host;
    reply.guest = guestPlayer;

    this.sendOthersMessage(
      game,
      guestPlayer.id,
      comm.Message.EVENT_PLAYER_JOINED,
      {
        'game': game,
        'host': game.host,
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

    var game = this.getSocketGame(socket);
    var player = this.getSocketPlayer(socket);

    if ((game.host == null) || (game.host.id != player.id)) {
      reply.errorMessage = 'Game with ID ' + game.id + ' not owned by player with ID ' + player.id + '!';
      return false;
    }

    if (!model.Game.hasGuestJoined(game)) {
      reply.errorMessage = 'Game with ID ' + game.id + ' has no guest player!';
      return false;
    }

    game.hasStarted = true;
    game.turnPlayer = player;

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

    var game = this.getSocketGame(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);

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
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {number} params.position - Position of piece to move
   * @param {number} params.steps - Number of steps to move
   * @param {PieceType} params.type - Type of piece
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleMovePiece = function (socket, params, reply) {
    console.log('Moving a piece', params);

    var game = this.getSocketGame(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);

    //if (player.currentPieceType != params.type) {
    //  reply.errorMessage = 'Player cannot move ' + params.type + ' pieces!';
    //  return false;
    //}

    /*
    if (!rule.validateMove(game, params.position, params.type, params.steps)) {
      reply.errorMessage = 'Requested move is not valid!';
      return false;
    }
    */

    var actionList = rule.getMoveActions(game, params.position, player.currentPieceType, params.steps);
    if (actionList.length == 0) {
      reply.errorMessage = 'Requested move is not valid!';
      return false;
    }

    rule.applyMoveActions(game, actionList);

    rule.markAsPlayed(game, params.steps);

    reply.position = params.position;
    reply.type = params.type;
    reply.steps = params.steps;
    reply.moveActionList = actionList;

    this.sendGameMessage(
      game,
      //player.id,
      comm.Message.EVENT_PIECE_MOVE,
      {
        'game': game,
        'position': params.position,
        'type': params.type,
        'steps': params.steps,
        'moveActionList': actionList
      }
    );

    return true;
  };

  /**
   * Handle client's request to confirm moves made in current turn
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleConfirmMoves = function (socket, params, reply) {
    console.log('Confirming piece movement', params);

    var game = this.getSocketGame(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);

    if (!rule.validateConfirm(game, player.currentPieceType)) {
      reply.errorMessage = 'Confirming moves is not allowed!';
      return false;
    }

    // Start next turn:
    // 1. Reset turn
    // 2. Change players
    // 3. Roll new dice

    game.turnConfirmed = false;
    game.turnPlayer = (game.turnPlayer.id == game.host.id) ? game.guest: game.host;
    game.turnDice = rule.rollDice();

    this.sendGameMessage(
      game,
      comm.Message.EVENT_TURN_START,
      {
        'game': game
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
