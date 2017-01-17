'use strict';

var path = require('path');
var express = require('express');
var expressServer = express();
var http = require('http').Server(expressServer);
var io = require('socket.io')(http);
var comm = require('../../lib/comm.js');
var model = require('../../lib/model.js');
var queue_manager = require('./queue_manager.js');
require('../../lib/rules/rule.js');

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
   * List of all matches
   * @type {Match[]}
   */
  this.matches = [];

  /**
   * List of all games
   * @type {Game[]}
   */
  this.games = [];

  /**
   * Responsible for management of queues with players waiting to play
   * @type {QueueManager}
   */
  this.queueManager = new queue_manager.QueueManager();

  /**
   * Server's default config object
   * @type {{rulePath: string, enabledRules: string[]}}
   */
  this.config = require('./config');
  
  /**
   * Load enabled rules
   */
  this.loadRules = function () {
    for (var i = 0; i < this.config.enabledRules.length; i++) {
      var ruleName = this.config.enabledRules[i];
      require(this.config.rulePath + ruleName + '.js');
    }
  };
  
  /**
   * Run server instance
   */
  this.run = function () {
    /** Reference to server instance */
    var self = this;
    
    this.loadRules();

    expressServer.use(express.static(path.join(__dirname, '../browser')));

    io.on('connection', function (socket) {
      console.log('Client connected');

      self.clients[socket.id] = socket;

      socket.on('disconnect', function(){
        try {
          self.handleDisconnect(socket);
        }
        catch (e) {
          console.log(e);
        }
      });
      
      // Subscribe for client requests:
      var m = comm.Message;
      var messages = [
        m.CREATE_GUEST,
        m.GET_MATCH_LIST,
        m.PLAY_RANDOM,
        m.CREATE_MATCH,
        m.JOIN_MATCH,
        m.ROLL_DICE,
        m.MOVE_PIECE,
        m.CONFIRM_MOVES,
        m.UNDO_MOVES,
        m.RESIGN_GAME,
        m.RESIGN_MATCH
      ];

      var createHandler = function(msg){
        return function(params) {
          try {
            self.handleRequest(msg, socket, params);
          }
          catch (e) {
            console.log(e);
          }
        };
      };

      var i;
      for (i = 0; i < messages.length; i++) {
        var msg = messages[i];
        socket.on(msg, createHandler(msg));
      }

    });

    var host = process.env.OPENSHIFT_NODEJS_IP || comm.Protocol.BindAddress;
    var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || comm.Protocol.Port;
    http.listen(port, host, function () {
      console.log('listening on *:' + port);
    });
  };
  
  /**
   * Get match object associated with a socket
   * @param {Socket} socket - Client's socket
   * @returns {Match} - Match object associated with this socket
   */
  this.getSocketMatch = function (socket) {
    return socket.match;
  };

  /**
   * Get game object associated with a socket
   * @param {Socket} socket - Client's socket
   * @returns {Game} - Game object associated with this socket
   */
  this.getSocketGame = function (socket) {
    return socket.game;
  };

  /**
   * Get game object associated with a socket
   * @param {Socket} socket - Client's socket
   * @returns {Player} - Player object associated with this socket
   */
  this.getSocketPlayer = function (socket) {
    return socket.player;
  };

  /**
   * Get game object associated with a socket
   * @param {Socket} socket - Client's socket
   * @returns {Rule} - Rule object associated with this socket
   */
  this.getSocketRule = function (socket) {
    return socket.rule;
  };
  
  /**
   * Associate match object with socket
   * @param {Socket} socket - Client's socket
   * @param {Match} match - Match object to associate
   */
  this.setSocketMatch = function (socket, match) {
    socket.match = match;
  };

  /**
   * Associate game object with socket
   * @param {Socket} socket - Client's socket
   * @param {Game} game - Game object to associate
   */
  this.setSocketGame = function (socket, game) {
    socket.game = game;
  };

  /**
   * Associate player object with socket
   * @param {Socket} socket - Client's socket
   * @param {Player} player - Player object to associate
   */
  this.setSocketPlayer = function (socket, player) {
    socket.player = player;
  };

  /**
   * Associate player object with socket
   * @param {Socket} socket - Client's socket
   * @param {Rule} rule - Rule object to associate
   */
  this.setSocketRule = function (socket, rule) {
    socket.rule = rule;
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
   * Send message to all players in a match
   * @param {Match} match - Match, whose players to send message to
   * @param {string} msg - Message ID
   * @param {Object} params - Object map with message parameters
   */
  this.sendMatchMessage = function (match, msg, params) {
    for (var i = 0; i < match.players.length; i++) {
      this.sendPlayerMessage(match.players[i], msg, params);
    }
  };

  /**
   * Send message to other players in the match, except the specified one
   * @param {Match} match - Match, whose players to send message to
   * @param {number} exceptPlayerID - Do not send message to this player
   * @param {string} msg - Message ID
   * @param {Object} params - Object map with message parameters
   */
  this.sendOthersMessage = function (match, exceptPlayerID, msg, params) {
    for (var i = 0; i < match.players.length; i++) {
      if (match.players[i].id === exceptPlayerID) {
        continue;
      }
      this.sendPlayerMessage(match.players[i], msg, params);
    }
  };

  /**
   * Handle client disconnect
   * @param {Socket} socket - Client socket
   */
  this.handleDisconnect = function (socket) {
    console.log('Client disconnected');
    
    // DONE: remove this client from the waiting queue
    var player = this.getSocketPlayer(socket);
    if (!player) {
        return;
    }
    
    this.queueManager.removeFromAll(player);
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
    else if (msg === comm.Message.GET_MATCH_LIST) {
      reply.result = this.handleGetMatchList(socket, params, reply);
    }
    else if (msg === comm.Message.PLAY_RANDOM) {
      reply.result = this.handlePlayRandom(socket, params, reply);
    }
    else if (msg === comm.Message.CREATE_MATCH) {
      reply.result = this.handleCreateMatch(socket, params, reply);
    }
    else if (msg === comm.Message.JOIN_MATCH) {
      reply.result = this.handleJoinMatch(socket, params, reply);
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
    else if (msg === comm.Message.UNDO_MOVES) {
      reply.result = this.handleUndoMoves(socket, params, reply);
    }
    else if (msg === comm.Message.RESIGN_GAME) {
      reply.result = this.handleResignGame(socket, params, reply);
    }
    else if (msg === comm.Message.RESIGN_MATCH) {
      reply.result = this.handleResignMatch(socket, params, reply);
    }
    else {
      console.log('Unknown message!');
      return;
    }

    var match = this.getSocketMatch(socket);
    if (match) {
      reply.match = match;
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
    
    var player = null;
    var cookie = socket.handshake.headers.cookie;
    if (cookie) {
      var m = cookie.match(/\bplayer_id=([0-9]+)/);
      var playerID = m ? m[1] : null;
      player = this.getPlayerByID(playerID);
      console.log('Player ID found in cookie: ' + playerID);
    }
    
    if (player) {
      // Player already exists, but has been disconnected
      var match = this.getMatchByID(player.currentMatch);
      
      // If there is a pending match, use existing player,
      // else create a new player object
      if (match && !match.isOver)
      {
        var rule = model.Utils.loadRule(match.ruleName);
        player.socketID = socket.id;
        this.setSocketPlayer(socket, player);
        this.setSocketMatch(socket, match);
        this.setSocketRule(socket, rule);

        var self = this;
        reply.sendAfter = function () {
          self.sendPlayerMessage(
            player,
            comm.Message.EVENT_MATCH_START,
            {
              'match': match
            }
          );
        };
        
        reply.player = player;
        reply.reconnected = true;

        return true;        
      }
    }
    
    // New player will be created
    player = model.Player.createNew();
    player.name = 'Player ' + player.id;
    this.players.push(player);
    console.log('New player ID: ' + player.id);

    player.socketID = socket.id;
    this.setSocketPlayer(socket, player);

    reply.player = player;

    return true;
  };

  /**
   * Handle client's request to get list of active matches
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleGetMatchList = function (socket, params, reply) {
    console.log('List of matches requested');

    var list = [];

    for (var i = 0; i < this.matches.length; i++) {
      list.push({
        'id': this.matches[i].id
      });
    }

    reply.list = list;

    return true;
  };
  
  /**
   * Handle client's request to play a random match.
   * If there is another player waiting in queue, start a match
   * between the two players. If there are no other players
   * waiting, put player in queue.
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {string} params.ruleName - Name of rule that should be used for creating the match
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handlePlayRandom = function (socket, params, reply) {
    console.log('Play random match');
    
    var player = this.getSocketPlayer(socket);
    if (!player) {
        reply.errorMessage = 'Player not found!';
        return false;
    }

    var otherPlayer = null;
    if (params.ruleName === '*') {
      params.ruleName = '.*';
    }

    var popResult = this.queueManager.popFromRandom(params.ruleName);
    
    otherPlayer = popResult.player;
    // TODO: Make sure otherPlayer has not disconnected while waiting.
    //       If that is the case, pop another player from the queue.
    
    if (otherPlayer) {
      if (params.ruleName === '.*')
      {
        params.ruleName = popResult.ruleName;
      }
      
      if (params.ruleName === '.*')
      {
        params.ruleName = model.Utils.getRandomElement(this.config.enabledRules);
      }
      
      // Start a new match with this other player
      var rule = model.Utils.loadRule(params.ruleName);
      var match = model.Match.createNew(rule);
      
      otherPlayer.currentMatch = match.id;
      otherPlayer.currentPieceType = model.PieceType.WHITE;
      model.Match.addHostPlayer(match, otherPlayer);
      
      player.currentMatch = match.id;
      player.currentPieceType = model.PieceType.BLACK;
      model.Match.addGuestPlayer(match, player);
      
      this.matches.push(match);
      
      var game = model.Match.createNewGame(match, rule);
      this.games.push(game);
      game.hasStarted = true;
      game.turnPlayer = otherPlayer;
      game.turnNumber = 1;

      // Assign match and rule objects to sockets of both players
      this.setSocketMatch(socket, match);
      this.setSocketRule(socket, rule);
      
      var otherSocket = this.clients[otherPlayer.socketID];
      this.setSocketMatch(otherSocket, match);
      this.setSocketRule(otherSocket, rule);
      
      // Remove players from waiting queue
      this.queueManager.remove(player);
      this.queueManager.remove(otherPlayer);

      // Prepare reply
      reply.host = otherPlayer;
      reply.guest = player;
      reply.ruleName = params.ruleName;
      
      var self = this;
      reply.sendAfter = function () {
        self.sendMatchMessage(
          match,
          comm.Message.EVENT_MATCH_START,
          {
            'match': match
          }
        );
      };
      
      return true;
    }
    else {
      // Put player in queue, and wait for another player
      this.queueManager.addToRandom(player, params.ruleName);
      
      reply.isWaiting = true;
      return true;
    }
  };

  /**
   * Handle client's request to create a new match
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {string} params.ruleName - Name of rule that should be used for creating the match
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleCreateMatch = function (socket, params, reply) {
    console.log('Creating new match', params);

    var player = this.getSocketPlayer(socket);
    if (!player) {
        reply.errorMessage = 'Player not found!';
        return false;
    }

    // If player has chosen `Any` as rule
    if (params.ruleName === '*') {
      // Choose random rule
      params.ruleName = model.Utils.getRandomElement(this.config.enabledRules);
    }

    var rule = model.Utils.loadRule(params.ruleName);

    var match = model.Match.createNew(rule);
    model.Match.addHostPlayer(match, player);
    player.currentMatch = match.id;
    player.currentPieceType = model.PieceType.WHITE;
    this.matches.push(match);
    
    var game = model.Match.createNewGame(match, rule);
    this.games.push(game);

    this.setSocketMatch(socket, match);
    this.setSocketRule(socket, rule);

    reply.player = player;
    reply.ruleName = params.ruleName;
    reply.matchID = match.id;

    return true;
  };

  /**
   * Handle client's request to join a new match
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {string} params.matchID - ID of match to join
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleJoinMatch = function (socket, params, reply) {
    console.log('Joining match', params);

    if (this.matches.length <= 0) {
      reply.errorMessage = 'Match with ID ' + params.matchID + ' not found!';
      return false;
    }
    
    var match = this.getMatchByID(params.matchID);
    if (!match) {
      reply.errorMessage = 'Match with ID ' + params.matchID + ' not found!';
      return false;
    }

    if (match.guest) {
      reply.errorMessage = 'Match with ID ' + match.id + ' is full!';
      return false;
    }

    var guestPlayer = this.getSocketPlayer(socket);
    if (!guestPlayer) {
      reply.errorMessage = 'Player not found!';
      return false;
    }

    var rule = model.Utils.loadRule(match.ruleName);

    model.Match.addGuestPlayer(match, guestPlayer);

    guestPlayer.currentMatch = match.id;
    guestPlayer.currentPieceType = model.PieceType.BLACK;

    // Directly start match
    match.currentGame.hasStarted = true;
    match.currentGame.turnPlayer = match.host;
    match.currentGame.turnNumber = 1;

    var self = this;
    reply.sendAfter = function () {
      self.sendMatchMessage(
        match,
        comm.Message.EVENT_MATCH_START,
        {
          'match': match
        }
      );
    };

    this.setSocketMatch(socket, match);
    this.setSocketRule(socket, rule);

    reply.ruleName = match.ruleName;
    reply.host = match.host;
    reply.guest = guestPlayer;

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

    var match = this.getSocketMatch(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);
    
    var game = match.currentGame;
    
    if (!game) {
      reply.errorMessage = 'Match with ID ' + match.id + ' has no current game!';
      return false;
    }

    if (!game.hasStarted) {
      reply.errorMessage = 'Game with ID ' + game.id + ' is not yet started!';
      return false;
    }

    if ((!game.turnPlayer) || (game.turnPlayer.id !== player.id)) {
      reply.errorMessage = 'Cannot roll dice it isn\'t player ' + player.id + ' turn!';
      return false;
    }

    if (model.Game.diceWasRolled(game)) {
      reply.errorMessage = 'Dice was already rolled!';
      return false;
    }

    var dice = rule.rollDice(game);
    game.turnDice = dice;

    model.Game.snapshotState(match.currentGame);

    reply.player = game.turnPlayer;
    reply.dice = dice;

    this.sendOthersMessage(
      match,
      player.id,
      comm.Message.EVENT_DICE_ROLL,
      {
        'match': match
      }
    );

    return true;
  };

  /**
   * Handle client's request to move a piece.
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {number} params.piece - Piece to move
   * @param {number} params.steps - Number of steps to move
   * @param {PieceType} params.type - Type of piece
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleMovePiece = function (socket, params, reply) {
    console.log('Moving a piece', params);

    var match = this.getSocketMatch(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);
    
    console.log('Piece:', params.piece);
    
    if (!params.piece) {
      reply.errorMessage = 'No piece selected!';
      return false;
    }
    
    if (!match.currentGame) {
      reply.errorMessage = 'Match created, but current game is null!';
      return false;
    }

    if (params.moveSequence < match.currentGame.moveSequence) {
      reply.errorMessage = 'This move has already been played!';
      return false;
    }

    // First, check status of the game: if game was started, if it is player's turn, etc.
    if (!rule.validateMove(match.currentGame, player, params.piece, params.steps)) {
      reply.errorMessage = 'Requested move is not valid!';
      return false;
    }

    var actionList = rule.getMoveActions(match.currentGame.state, params.piece, params.steps);
    if (actionList.length === 0) {
      reply.errorMessage = 'Requested move is not allowed!';
      return false;
    }

    try {
      rule.applyMoveActions(match.currentGame.state, actionList);
      rule.markAsPlayed(match.currentGame, params.steps);
      
      match.currentGame.moveSequence++;
      
      reply.piece = params.piece;
      reply.type = params.type;
      reply.steps = params.steps;
      reply.moveActionList = actionList;

      this.sendMatchMessage(
        match,
        comm.Message.EVENT_PIECE_MOVE,
        {
          'match': match,
          'piece': params.piece,
          'type': params.type,
          'steps': params.steps,
          'moveActionList': actionList
        }
      );

      return true;      
    }
    catch (e) {
      reply.piece = params.piece;
      reply.type = params.type;
      reply.steps = params.steps;
      reply.moveActionList = [];

      //throw e;
      
      return false;
    }
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
    
    var self = this;

    var match = this.getSocketMatch(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);

    if (!rule.validateConfirm(match.currentGame, player)) {
      reply.errorMessage = 'Confirming moves is not allowed!';
      return false;
    }
    
    var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
    
    console.log('CONFIRM MOVES');
    // Check if player has won
    if (rule.hasWon(match.currentGame.state, player)) {

      // TODO: Move ending game logic to rule. Keep only calls
      //       sending messages to client.
      this.endGame(socket, player, false, reply);
    }
    else {
      rule.nextTurn(match);

      this.sendMatchMessage(
        match,
        comm.Message.EVENT_TURN_START,
        {
          'match': match
        }
      );
    }

    return true;
  };

  /**
   * Handle client's request to undo moves made
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleUndoMoves = function (socket, params, reply) {
    console.log('Undo moves', params);

    var match = this.getSocketMatch(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);

    if (!rule.validateUndo(match.currentGame, player)) {
      reply.errorMessage = 'Undo moves is not allowed!';
      return false;
    }

    var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;

    model.Game.restoreState(match.currentGame);

    this.sendMatchMessage(
      match,
      comm.Message.EVENT_UNDO_MOVES,
      {
        'match': match
      }
    );

    return true;
  };
  
  /**
   * Handle client's request to resign from current game (game only, not whole match)
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleResignGame = function (socket, params, reply) {
    console.log('Resign game', params);

    var match = this.getSocketMatch(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);
    var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
    
    this.endGame(socket, otherPlayer, true, reply);
    
    return true;
  };
  
  /**
   * Handle client's request to resign from whole match
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.handleResignMatch = function (socket, params, reply) {
    console.log('Resign match', params);

    var match = this.getSocketMatch(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);
    var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
    
    var self = this;
    
    reply.sendAfter = function () {
      self.sendMatchMessage(
        match,
        comm.Message.EVENT_MATCH_OVER,
        {
          'match': match,
          'winner': otherPlayer,
          'resigned': true
        }
      );
    };
    
    return true;
  };
  
  /**
   * End game
   * @param {Socket} socket - Client socket
   * @param {Object} params - Request parameters
   * @param {Object} reply - Object to be send as reply
   * @returns {boolean} - Returns true if message have been processed
   *                      successfully and a reply should be sent.
   */
  this.endGame = function (socket, winner, resigned, reply) {
    var self = this;

    var match = this.getSocketMatch(socket);
    var player = this.getSocketPlayer(socket);
    var rule = this.getSocketRule(socket);
    var otherPlayer = (model.Match.isHost(match, player)) ? match.guest : match.host;
    
    // 1. Update score
    var score = rule.getGameScore(match.currentGame.state, winner);
    match.score[winner.currentPieceType] += score;

    if (match.score[winner.currentPieceType] >= match.length) {
      match.isOver = true;
    }

    if (match.isOver) {
      // 3. End match
      reply.sendAfter = function () {
        self.sendMatchMessage(
          match,
          comm.Message.EVENT_MATCH_OVER,
          {
            'match': match,
            'winner': winner,
            'resigned': resigned
          }
        );
      };
    }
    else {
      // 2. Start a new game
      // NEXT: Start a new game
      var game = model.Match.createNewGame(match, rule);
      this.games.push(game);
      game.hasStarted = true;
      game.turnPlayer = winner;
      game.turnNumber = 1;

      reply.sendAfter = function () {
        self.sendMatchMessage(
          match,
          comm.Message.EVENT_GAME_OVER,
          {
            'match': match,
            'winner': winner,
            'resigned': resigned
          }
        );

        self.sendMatchMessage(
          match,
          comm.Message.EVENT_GAME_RESTART,
          {
            'match': match,
            'game': match.currentGame,
            'resigned': resigned
          }
        );
      };
    }

    return true;
  };

  /**
   * Get player by ID
   * @param {number} id - Player's ID
   * @returns {Player} - Returns player or null if not found.
   */
  this.getPlayerByID = function (id) {
    console.log('Length:' + this.players.length);
    for (var i = 0; i < this.players.length; i++) {
      console.log(this.players[i]);
      if (this.players[i].id === id) {
        return this.players[i];
      }
    }
    return null;
  };

  /**
   * Get match by ID
   * @param {number} id - Match ID
   * @returns {Match} - Returns match or null if not found.
   */
  this.getMatchByID = function (id) {
    for (var i = 0; i < this.matches.length; i++) {
      if (this.matches[i].id === id) {
        return this.matches[i];
      }
    }
    return null;
  };

}

var server = new Server();
server.run();