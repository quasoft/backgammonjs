'use strict';
/*jslint browser: true */

var model = require('./model.js');
var comm = require('./comm.js');
var io = require('socket.io-client');
require('../app/browser/js/SimpleBoardUI.js');
require('./rules/rule.js');
require('./rules/RuleBgCasual.js');
require('./rules/RuleBgGulbara.js');
require('./rules/RuleBgTapa.js');

/**
 * Backgammon client
 * @constructor
 * @param {Object} config - Configuration object
 * @param {string} config.containerID - ID of HTML container tag (defaults to 'backgammon')
 * @param {string} config.boardID - ID of board tag (defaults to 'board')
 * @param {string} config.rulePath - path to rules directory, relative to lib directory (defaults to './rules/')
 * @param {string} config.boardUI - board UI filename, relative to project root (defaults to '../app/browser/js/SimpleBoardUI.js')
 */
function Client(config) {

  /**
   * Client's socket object
   * @type {Socket}
   */
  this._socket = null;
  
  /**
   * Counter used to generate unique sequence number for messages in client's session
   * @type {number}
   */
  this._clientMsgSeq = 0;
  
  /**
   * Map of callback functions to be executed after server replies to a message
   * @type {Object}
   */
  this._callbackList = {};
  
  /**
   * Dictionary of arrays, containing subscriptions for reception of messages by id/type.
   * The key of the dictionary is the message ID.
   * The value of the dictionary is an array with callback functions to execute when message is received.
   * @type {{Array}}
   */
  this._msgSubscriptions = {};  

  /**
   * Client's player object
   * @type {Player}
   */
  this.player = null;

  /**
   * Other player object
   * @type {Player}
   */
  this.otherPlayer = null;
  
  /**
   * Current match
   * @type {Match}
   */
  this.match = null;

  /**
   * Rule used in current match
   * @type {Rule}
   */
  this.rule = null;

  /**
   * Default client configuration
   * @type {{containerID: string, boardID: string, rulePath: string, boardUI: string}}
   */
  this.config = {
    'containerID': 'backgammon',
    'boardID': 'board',
    'rulePath': './rules/',
    'boardUI': '../app/browser/js/SimpleBoardUI.js'
  };

  /**
   * Initialize client
   * @param {Object} config - Configuration object
   * @param {string} config.containerID - ID of HTML container tag (defaults to 'backgammon')
   * @param {string} config.boardID - ID of board tag (defaults to 'board')
   * @param {string} config.rulePath - path to rules directory, relative to lib directory (defaults to './rules/')
   * @param {string} config.boardUI - board UI filename, relative to project root (defaults to '../app/browser/js/SimpleBoardUI.js')
   */
  this.init = function (config) {
    for (var attrname in config) { this.config[attrname] = config[attrname]; }

    var boardUIClass = require(this.config.boardUI);
    this.boardUI = new boardUIClass(this);
    this.boardUI.init();

    this._openSocket();
  };

  /**
   * Prepare socket and attach message handlers
   */
  this._openSocket = function () {
    var self = this;

    var serverURL = this.config.serverURL;
    if (!serverURL) {
      serverURL = window.location.host;
    }
    this._socket = io.connect(serverURL, {'force new connection': true});

    // Subscribe for connect:
    this._socket.on(comm.Message.CONNECT, function(){
      self.handleConnect();
      self.updateUI();
    });
    
    // Subscribe for other messages:
    var m = comm.Message;
    var messages = [
      m.CREATE_GUEST,
      m.GET_MATCH_LIST,
      m.PLAY_RANDOM,
      m.CREATE_MATCH,
      m.JOIN_MATCH,
      m.ROLL_DICE,
      m.MOVE_PIECE,
      m.EVENT_PLAYER_JOINED,
      m.EVENT_TURN_START,
      m.EVENT_DICE_ROLL,
      m.EVENT_PIECE_MOVE,
      m.EVENT_MATCH_START,
      m.EVENT_GAME_OVER,
      m.EVENT_MATCH_OVER,
      m.EVENT_GAME_RESTART,
      m.EVENT_UNDO_MOVES
    ];
    
    var createHandler = function(msg){
      return function(params) {
        self.handleMessage(msg, params);
      };
    };

    var i;
    for (i = 0; i < messages.length; i++) {
      var msg = messages[i];
      this._socket.on(msg, createHandler(msg));
    }

  };
  
  /**
   * Message callback
   *
   * @callback messageCallback
   * @param {number} msg - An integer.
   * @param {number} clientMsgSeq - An integer.
   * @param {Object} reply - Object containing reply data.
   * @param {boolean} reply.result - Result of command execution
   */  

  /**
   * Send message to server.
   * @param {string} msg - Message ID
   * @param {Object} [params] - Object map with message parameters
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply to this message
   */
  this.sendMessage = function (msg, params, callback) {
    params = params || {};
    params.clientMsgSeq = ++this._clientMsgSeq;
    
    // Store reference to callback. It will be executed when server replies to this message
    this._callbackList[params.clientMsgSeq] = callback;
    
    console.log('Sending message ' + msg + ' with ID ' + params.clientMsgSeq);
    
    this._socket.emit(msg, params);
  };

  /**
   * Handle connection to server.
   */
  this.handleConnect = function () {
    console.log('Client connected');

    if (this.player) {
      this.sendMessage(
        comm.Message.CREATE_GUEST,
        {
          'playerID': this.player.id
        }
      );
    }
    else {
      this.sendMessage(comm.Message.CREATE_GUEST);
    }
  };

  /**
   * Handle reply/event message.
   * @param {string} msg - Message ID
   * @param {Object} params - Message parameters
   */
  this.handleMessage = function (msg, params) {
    console.log('Reply/event received: ' + msg);
    console.log(params);

    // Update match object
    if ((params) && (params.match) && (this.match) &&
       (this.match.id == params.match.id)) {
      this.updateMatch(params.match);
    }

    // Process message
    if (msg == comm.Message.CREATE_GUEST) {
      this.handleCreateGuest(params);
    }
    else if (msg == comm.Message.GET_MATCH_LIST) {
      this.handleGetMatchList(params);
    }
    else if (msg == comm.Message.PLAY_RANDOM) {
      this.handlePlayRandom(params);
    }
    else if (msg == comm.Message.CREATE_MATCH) {
      this.handleCreateMatch(params);
    }
    else if (msg == comm.Message.JOIN_MATCH) {
      this.handleJoinMatch(params);
    }
    else if (msg == comm.Message.ROLL_DICE) {
      this.handleRollDice(params);
    }
    else if (msg == comm.Message.MOVE_PIECE) {
      this.handleMovePiece(params);
    }
    else if (msg == comm.Message.EVENT_PLAYER_JOINED) {
      this.handleEventPlayerJoined(params);
    }
    else if (msg == comm.Message.EVENT_PIECE_MOVE) {
      this.handleEventPieceMove(params);
    }
    else if (msg == comm.Message.EVENT_TURN_START) {
      this.handleEventTurnStart(params);
    }
    else if (msg == comm.Message.EVENT_DICE_ROLL) {
      this.handleEventDiceRoll(params);
    }
    else if (msg == comm.Message.EVENT_MATCH_START) {
      this.handleEventMatchStart(params);
    }
    else if (msg == comm.Message.EVENT_GAME_OVER) {
      this.handleEventGameOver(params);
    }
    else if (msg == comm.Message.EVENT_MATCH_OVER) {
      this.handleEventMatchOver(params);
    }
    else if (msg == comm.Message.EVENT_GAME_RESTART) {
      this.handleEventGameRestart(params);
    }
    else if (msg == comm.Message.EVENT_UNDO_MOVES) {
      this.handleEventUndoMoves(params);
    }
    else {
      console.log('Unknown message!');
      return;
    }
    
    if (params.clientMsgSeq) {
      var callback = this._callbackList[params.clientMsgSeq];
      if (callback) {
        callback(msg, params.clientMsgSeq, params);
        
        delete this._callbackList[params.clientMsgSeq];
      }
    }
    
    this._notify(msg, params);

    this.updateUI();
  };

  /**
   * Handle reply - Guest player created
   * @param {Object} params - Message parameters
   * @param {Player} params.player - Player object created
   */
  this.handleCreateGuest = function (params) {
    this.player = params.player;

    // TODO: update UI
    console.log('Created guest player (ID): ' + this.player.id);
    
    // Store player ID as cookie. It will be used to retrieve the player
    // object later, if page is reloaded.
    document.cookie = 'player_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'player_id=' + this.player.id;
  };

  /**
   * Handle reply - List of matfches returned
   * @param {Object} params - Message parameters
   */
  this.handleGetMatchList = function (params) {
    // TODO: update UI
    console.log('List of matches (IDs): ' + params.list.length);
  };
  
  /**
   * Handle reply - Start random match
   * @param {Object} params - Message parameters
   */
  this.handlePlayRandom = function (params) {
    // TODO: update UI
  };

  /**
   * Handle reply - New match has been created
   * @param {Object} params - Message parameters
   */
  this.handleCreateMatch = function (params) {
    if (!params.result) {
      return;
    }
    console.log('Created match with ID ' + params.match.id + ' and rule ' + params.ruleName);

    this.updatePlayer(params.player);
    this.updateMatch(params.match);
    this.updateRule(this.loadRule(params.ruleName));
    this.resetBoard(this.match, this.rule);
  };

  /**
   * Handle reply - Joined new match
   * @param {Object} params - Message parameters
   */
  this.handleJoinMatch = function (params) {
    if (!params.result) {
      return;
    }
    console.log('Joined match with ID ' + params.match.id + ' and rule ' + params.ruleName);

    this.updatePlayer(params.guest);
    this.updateOtherPlayer(params.host);
    this.updateMatch(params.match);
    this.updateRule(this.loadRule(params.ruleName));
    this.resetBoard(this.match, this.rule);
  };

  /**
   * Handle reply - Dice rolled
   * @param {Object} params - Message parameters
   */
  this.handleRollDice = function (params) {
    console.log('Dice rolled');
    console.log(params);
    console.log(this.match.currentGame);
  };

  /**
   * Handle reply - Piece moved
   * @param {Object} params - Message parameters
   */
  this.handleMovePiece = function (params) {
    console.log('Piece move');
    if (!params.result) {
      this.boardUI.notifyError(params.errorMessage);
    }
  };

  /**
   * Handle event - Another player joined match
   * @param {Object} params - Message parameters
   */
  this.handleEventPlayerJoined = function (params) {
    console.log('Player ' + params.guest.id + ' joined match ' + this.match.id);
    this.updateOtherPlayer(params.guest);
    this.boardUI.notifyInfo('Player ' + params.guest.id + ' joined match ');
  };

  /**
   * Handle event - New turn started
   * @param {Object} params - Message parameters
   */
  this.handleEventTurnStart = function (params) {
    console.log('Turn start');
    
    this.boardUI.handleTurnStart();
  };

  /**
   * Handle event - Dice rolled
   * @param {Object} params - Message parameters
   */
  this.handleEventDiceRoll = function (params) {
    console.log('Dice rolled');
  };

  /**
   * Handle event - Piece moved
   * @param {Object} params - Message parameters
   * @param {number} params.position - Position of piece being moved
   * @param {PieceType} params.type - Type of piece being moved
   * @param {number} params.steps - Number steps the piece is moved with
   * @param {MoveAction[]} params.moveActionList - List of actions that have to be played in UI
   */
  this.handleEventPieceMove = function (params) {
    console.log('Piece moved');
    this.boardUI.playActions(params.moveActionList);
  };
  
  /**
   * Handle event - Piece moved
   * @param {Object} params - Message parameters
   * @param {number} params.match - Match that has been started
   */
  this.handleEventMatchStart = function (params) {
    console.log('Match started');
    
    if (model.Match.isHost(params.match, this.player)) {
      this.updatePlayer(params.match.host);
      this.updateOtherPlayer(params.match.guest);
    }
    else {
      this.updatePlayer(params.match.guest);
      this.updateOtherPlayer(params.match.host);
    }
    
    this.updateMatch(params.match);
    this.updateRule(this.loadRule(params.match.ruleName));
    this.resetBoard(this.match, this.rule);
  };
  
  /**
   * Handle event - Game over. Current game is over. Prepare for next game of match, if any.
   * @param {Object} params - Message parameters
   * @param {number} params.match - Match that has been started
   */
  this.handleEventGameOver = function (params) {
    console.log('Game is over. Winner:', params.winner);
    this.boardUI.showGameEndMessage(params.winner, params.resigned);
  };
  
  /**
   * Handle event - Match is over. Offer rematch or starting a new game.
   * @param {Object} params - Message parameters
   * @param {number} params.match - Match that has been started
   */
  this.handleEventMatchOver = function (params) {
    console.log('Match is over. Winner:', params.winner);
    this.boardUI.showGameEndMessage(params.winner, params.resigned);
  };
  
  /**
   * Handle event - Game restart. Current game in match is over. Match is not finished, so start next game.
   * @param {Object} params - Message parameters
   */
  this.handleEventGameRestart = function (params) {
    console.log('Restarting game for match ' + this.match.id + ' with rule ' + this.rule.name);
    this.resetBoard(this.match, this.rule);
    this.boardUI.handleEventGameRestart();
  };

  /**
   * Handle event - Undo moves
   * @param {Object} params - Message parameters
   */
  this.handleEventUndoMoves = function (params) {
    console.log('Undoing moves for match ' + this.match.id + ' with rule ' + this.rule.name);
    this.boardUI.handleEventUndoMoves();
    this.resetBoard(this.match, this.rule);
  };

  /**
   * Load rule module
   * @param {string} ruleName - Rule's name, equal to rule's class name (eg. RuleBgCasual)
   * @returns {Rule} - Corresponding rule object
   */
  this.loadRule = function (ruleName) {
    var fileName = model.Utils.sanitizeName(ruleName);
    var file = this.config.rulePath + fileName + '.js';
    var rule = require(file);
    rule.name = fileName;
    return rule;
  };

  /**
   * Init game
   * @param {Match} match - Game
   * @param {Rule} rule - Rule object to use
   */
  this.resetBoard = function (match, rule) {
    this.boardUI.resetBoard(match, rule);
  };

  /**
   * Update player.
   *
   * After an object has been updated, an update to UI should also be triggered.
   *
   * @param {Player} player - Updated player's object to use
   */
  this.updatePlayer = function (player) {
    this.player = player;
  };

  /**
   * Update other player.
   *
   * After an object has been updated, an update to UI should also be triggered.
   *
   * @param {Player} player - Updated other player's object to use
   */
  this.updateOtherPlayer = function (player) {
    this.otherPlayer = player;
  };

  /**
   * Update match object.
   *
   * After an object has been updated, an update to UI should also be triggered.
   *
   * @param {Match} match - Updated match object to use
   */
  this.updateMatch = function (match) {
    this.match = match;
    this.boardUI.match = match;
  };

  /**
   * Update rule object.
   *
   * After an object has been updated, an update to UI should also be triggered.
   *
   * @param {Rule} rule - Updated rule object to use
   */
  this.updateRule = function (rule) {
    this.rule = rule;
    this.boardUI.rule = rule;
  };

  /**
   * Trigger update of board's UI.
   */
  this.updateUI = function () {
    this.boardUI.updateControls();
    this.boardUI.updateScoreboard();
  };
  
  /**
   * Subscribe for notification on message reception
   * @param {number} msgID - The type of message to subscribe for
   * @param {messageCallback} [callback] - Callback function to be called on reception of this message
   */
  this.subscribe = function (msgID, callback) {
    this._msgSubscriptions[msgID] = this._msgSubscriptions[msgID] || [];
    this._msgSubscriptions[msgID].push(callback);
    console.log(this._msgSubscriptions);
  };
  
  /**
   * Subscribe for notification on message reception
   * @param {number} msg - The ID of the message received
   * @param {Object} params - Message parameters
   */
  this._notify = function (msg, params) {
    var callbackList = this._msgSubscriptions[msg];
    if (callbackList) {
      for (var i = 0; i < callbackList.length; i++) {
        console.log(callbackList[i]);
        callbackList[i](msg, params);
      }
    }
  };
  
  /**
   * Request playing a match with random player - from waiting queue.
   * @param {string} ruleName - Name of rule to use (eg. RuleBgCasual)
   * @param {Object} [params] - Object map with message parameters
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqPlayRandom = function (ruleName, params, callback) {
    if (typeof params === 'undefined') {
      params = {};
    }
    params.ruleName = ruleName;

    this.sendMessage(
      comm.Message.PLAY_RANDOM,
      params,
      callback
    );
  };

  /**
   * Request creating a new match.
   * @param {string} ruleName - Name of rule to use (eg. RuleBgCasual)
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqCreateMatch = function (ruleName, callback) {
    this.sendMessage(
      comm.Message.CREATE_MATCH,
      {
        'ruleName': ruleName
      },
      callback
    );
  };

  /**
   * Request joining a specific match.
   * @param {number} matchID - ID of match to join
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqJoinMatch = function (matchID, callback) {
    this.sendMessage(
      comm.Message.JOIN_MATCH,
      {
        'matchID': matchID
      },
      callback
    );
  };

  /**
   * Request rolling dice
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqRollDice = function (callback) {
    this.sendMessage(comm.Message.ROLL_DICE, undefined, callback);
  };

  /**
   * Confirm moves made
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqConfirmMoves = function (callback) {
    this.sendMessage(comm.Message.CONFIRM_MOVES, undefined, callback);
  };

  /**
   * Undo moves made since last confirm
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqUndoMoves = function (callback) {
    this.sendMessage(comm.Message.UNDO_MOVES, undefined, callback);
  };
  
  /**
   * Resign from current game only
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqResignGame = function (callback) {
    this.sendMessage(comm.Message.RESIGN_GAME, undefined, callback);
  };
  
  /**
   * Resign from whole match
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqResignMatch = function (callback) {
    this.sendMessage(comm.Message.RESIGN_MATCH, undefined, callback);
  };

  /**
   * Request moving a piece.
   * @param {Piece} piece - Denormalized position from which a piece has to be moved
   * @param {number} steps - Number of steps to move forward to first home position
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqMove = function (piece, steps, callback) {
    console.log('Move sequence: ', this.match.currentGame.moveSequence);
    this.sendMessage(
      comm.Message.MOVE_PIECE,
      {
        'piece': piece,
        'steps': steps,
        'moveSequence': this.match.currentGame.moveSequence
      },
      callback
    );
  };
  
  /**
   * Notify UI that DOM was rezised and UI may have to be updated
   */
  this.resizeUI = function () {
    this.boardUI.resizeUI();
  };


  this.init(config);
}

module.exports.Client = Client;
