var model = require('./model.js');
var comm = require('./comm.js');
var io = require('socket.io-client');
require('../app/browser/js/SimpleBoardUI.js');
require('./rules/rule.js');
require('./rules/RuleBgCasual.js');
require('./rules/RuleBgGulbara.js');

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
   * Current game
   * @type {Game}
   */
  this.game = null;

  /**
   * Rule used in current game
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

    this._socket = io.connect("http://localhost:" + comm.Protocol.Port, {'force new connection': true});

    this._socket.on(comm.Message.CONNECT, function(){
      self.handleConnect();
      self.updateUI();
    });

    this._socket.on(comm.Message.CREATE_GUEST, function(params){
      self.handleMessage(comm.Message.CREATE_GUEST, params);
    });

    this._socket.on(comm.Message.GET_GAME_LIST, function(params){
      self.handleMessage(comm.Message.GET_GAME_LIST, params);
    });
    
    this._socket.on(comm.Message.PLAY_RANDOM, function(params){
      self.handleMessage(comm.Message.PLAY_RANDOM, params);
    });

    this._socket.on(comm.Message.CREATE_GAME, function(params){
      self.handleMessage(comm.Message.CREATE_GAME, params);
    });

    this._socket.on(comm.Message.JOIN_GAME, function(params){
      self.handleMessage(comm.Message.JOIN_GAME, params);
    });

    this._socket.on(comm.Message.START_GAME, function(params){
      self.handleMessage(comm.Message.START_GAME, params);
    });

    this._socket.on(comm.Message.ROLL_DICE, function(params){
      self.handleMessage(comm.Message.ROLL_DICE, params);
    });

    this._socket.on(comm.Message.MOVE_PIECE, function(params){
      self.handleMessage(comm.Message.MOVE_PIECE, params);
    });

    this._socket.on(comm.Message.EVENT_GAME_START, function(params){
      self.handleMessage(comm.Message.EVENT_GAME_START, params);
    });

    this._socket.on(comm.Message.EVENT_PLAYER_JOINED, function(params){
      self.handleMessage(comm.Message.EVENT_PLAYER_JOINED, params);
    });

    this._socket.on(comm.Message.EVENT_TURN_START, function(params){
      self.handleMessage(comm.Message.EVENT_TURN_START, params);
    });

    this._socket.on(comm.Message.EVENT_DICE_ROLL, function(params){
      self.handleMessage(comm.Message.EVENT_DICE_ROLL, params);
    });

    this._socket.on(comm.Message.EVENT_PIECE_MOVE, function(params){
      self.handleMessage(comm.Message.EVENT_PIECE_MOVE, params);
    });
    
    this._socket.on(comm.Message.EVENT_RANDOM_GAME_START, function(params){
      self.handleMessage(comm.Message.EVENT_RANDOM_GAME_START, params);
    });

  };

  /**
   * Connect to server
   */
  this.connect = function () {
    console.log('Connecting to server at port ' + comm.Protocol.Port);
    this._socket.connect("http://localhost:" + comm.Protocol.Port, {'force new connection': true});
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

    if (!this.player) {
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

    // Update game object
    if ((params != null) && (params['game'] != null) && (this.game != null)
      && (this.game.id == params['game'].id)) {
      this.updateGame(params['game']);
    }

    // Process message
    if (msg == comm.Message.CREATE_GUEST) {
      this.handleCreateGuest(params);
    }
    else if (msg == comm.Message.GET_GAME_LIST) {
      this.handleGetGameList(params);
    }
    else if (msg == comm.Message.PLAY_RANDOM) {
      this.handlePlayRandom(params);
    }
    else if (msg == comm.Message.CREATE_GAME) {
      this.handleCreateGame(params);
    }
    else if (msg == comm.Message.JOIN_GAME) {
      this.handleJoinGame(params);
    }
    else if (msg == comm.Message.START_GAME) {
      this.handleStartGame(params);
    }
    else if (msg == comm.Message.ROLL_DICE) {
      this.handleRollDice(params);
    }
    else if (msg == comm.Message.MOVE_PIECE) {
      this.handleMovePiece(params);
    }
    else if (msg == comm.Message.EVENT_GAME_START) {
      this.handleEventGameStart(params);
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
    else if (msg == comm.Message.EVENT_RANDOM_GAME_START) {
      this.handleEventRandomGameStart(params);
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
  };

  /**
   * Handle reply - List of games returned
   * @param {Object} params - Message parameters
   */
  this.handleGetGameList = function (params) {
    // TODO: update UI
    console.log('List of games (IDs): ' + params.list.length);
  };
  
  /**
   * Handle reply - Start random game
   * @param {Object} params - Message parameters
   */
  this.handlePlayRandom = function (params) {
    // TODO: update UI
  };

  /**
   * Handle reply - New game has been created
   * @param {Object} params - Message parameters
   */
  this.handleCreateGame = function (params) {
    if (!params.result) {
      return;
    }
    console.log('Created game with ID ' + params.game.id + ' and rule ' + params.ruleName);

    this.updatePlayer(params.player);
    this.updateGame(params.game);
    this.updateRule(this.loadRule(params.ruleName));
    this.resetBoard(this.game, this.rule);
  };

  /**
   * Handle reply - Joined new game
   * @param {Object} params - Message parameters
   */
  this.handleJoinGame = function (params) {
    if (!params.result) {
      return;
    }
    console.log('Joined game with ID ' + params.game.id + ' and rule ' + params.ruleName);

    this.updatePlayer(params.guest);
    this.updateOtherPlayer(params.host);
    this.updateGame(params.game);
    this.updateRule(this.loadRule(params.ruleName));
    this.resetBoard(this.game, this.rule);
  };

  /**
   * Handle reply - Game started
   * @param {Object} params - Message parameters
   */
  this.handleStartGame = function (params) {
    console.log('Starting game ' + this.game.id + ' with rule ' + this.rule.name);
  };

  /**
   * Handle reply - Dice rolled
   * @param {Object} params - Message parameters
   */
  this.handleRollDice = function (params) {
    console.log('Dice rolled');
  };

  /**
   * Handle reply - Piece moved
   * @param {Object} params - Message parameters
   */
  this.handleMovePiece = function (params) {
    console.log('Piece moved');
  };

  /**
   * Handle event - Game started
   * @param {Object} params - Message parameters
   */
  this.handleEventGameStart = function (params) {
    console.log('Starting game ' + this.game.id + ' with rule ' + this.rule.name);
  };

  /**
   * Handle event - Another player joined game
   * @param {Object} params - Message parameters
   */
  this.handleEventPlayerJoined = function (params) {
    console.log('Player ' + params.guest.id + ' joined game ' + this.game.id);
    this.updateOtherPlayer(params.guest);
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
   * @param {number} params.game - Game that has been started
   */
  this.handleEventRandomGameStart = function (params) {
    console.log('Random game started');
    
    if (model.Game.isHost(params.game, this.player)) {
      this.updatePlayer(params.game.host);
      this.updateOtherPlayer(params.game.guest);
    }
    else {
      this.updatePlayer(params.game.guest);
      this.updateOtherPlayer(params.game.host);
    }
    
    this.updateGame(params.game);
    this.updateRule(this.loadRule(params.game.ruleName));
    this.resetBoard(this.game, this.rule);
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
   * @param {Game} game - Game
   * @param {Rule} rule - Rule object to use
   */
  this.resetBoard = function (game, rule) {
    this.boardUI.resetBoard(game, rule);
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
   * Update game object.
   *
   * After an object has been updated, an update to UI should also be triggered.
   *
   * @param {Game} game - Updated game object to use
   */
  this.updateGame = function (game) {
    this.game = game;
    this.boardUI.game = game;
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
  }
  
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
  }
  
  /**
   * Request playing a game with random player - from waiting queue.
   * @param {string} ruleName - Name of rule to use (eg. RuleBgCasual)
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqPlayRandom = function (ruleName, callback) {
    this.sendMessage(
      comm.Message.PLAY_RANDOM,
      {
        'ruleName': ruleName
      },
      callback
    );
  };

  /**
   * Request creating a new game.
   * @param {string} ruleName - Name of rule to use (eg. RuleBgCasual)
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqCreateGame = function (ruleName, callback) {
    this.sendMessage(
      comm.Message.CREATE_GAME,
      {
      'ruleName': ruleName
      },
      callback
    );
  };

  /**
   * Request joining a specific game.
   * @param {number} gameID - ID of game to join
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqJoinGame = function (gameID, callback) {
    this.sendMessage(
      comm.Message.JOIN_GAME,
      {
        'gameID': gameID
      },
      callback
    );
  };

  /**
   * Request starting game (if another player has already joined).
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqStartGame = function (callback) {
    //this.updateGame(null);
    //this.updateRule(null);
    this.updateUI();
    this.sendMessage(comm.Message.START_GAME, undefined, callback);
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
   * Request moving a piece.
   * @param {number} position - Denormalized position from which a piece has to be moved
   * @param {PieceType} type - Type of piece (white/black) - used for validation
   * @param {number} steps - Number of steps to move forward to first home position
   * @param {messageCallback} [callback] - Callback function to be called when server sends a reply
   */
  this.reqMove = function (position, type, steps, callback) {
    this.sendMessage(
      comm.Message.MOVE_PIECE,
      {
        'position': position,
        'type': type,
        'steps': steps
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
