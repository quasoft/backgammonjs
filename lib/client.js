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
  this.socket = null;

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

    this.openSocket();
  };

  /**
   * Prepare socket and attach message handlers
   */
  this.openSocket = function () {
    var self = this;

    this.socket = io.connect("http://localhost:" + comm.Protocol.Port, {'force new connection': true});

    this.socket.on(comm.Message.CONNECT, function(){
      self.handleConnect();
      self.updateUI();
    });

    this.socket.on(comm.Message.CREATE_GUEST, function(params){
      self.handleMessage(comm.Message.CREATE_GUEST, params);
    });

    this.socket.on(comm.Message.GET_GAME_LIST, function(params){
      self.handleMessage(comm.Message.GET_GAME_LIST, params);
    });

    this.socket.on(comm.Message.CREATE_GAME, function(params){
      self.handleMessage(comm.Message.CREATE_GAME, params);
    });

    this.socket.on(comm.Message.JOIN_GAME, function(params){
      self.handleMessage(comm.Message.JOIN_GAME, params);
    });

    this.socket.on(comm.Message.START_GAME, function(params){
      self.handleMessage(comm.Message.START_GAME, params);
    });

    this.socket.on(comm.Message.ROLL_DICE, function(params){
      self.handleMessage(comm.Message.ROLL_DICE, params);
    });

    this.socket.on(comm.Message.MOVE_PIECE, function(params){
      self.handleMessage(comm.Message.MOVE_PIECE, params);
    });

    this.socket.on(comm.Message.EVENT_GAME_START, function(params){
      self.handleMessage(comm.Message.EVENT_GAME_START, params);
    });

    this.socket.on(comm.Message.EVENT_PLAYER_JOINED, function(params){
      self.handleMessage(comm.Message.EVENT_PLAYER_JOINED, params);
    });

    this.socket.on(comm.Message.EVENT_TURN_START, function(params){
      self.handleMessage(comm.Message.EVENT_TURN_START, params);
    });

    this.socket.on(comm.Message.EVENT_DICE_ROLL, function(params){
      self.handleMessage(comm.Message.EVENT_DICE_ROLL, params);
    });

    this.socket.on(comm.Message.EVENT_PIECE_MOVE, function(params){
      self.handleMessage(comm.Message.EVENT_PIECE_MOVE, params);
    });

  };

  /**
   * Connect to server
   */
  this.connect = function () {
    console.log('Connecting to server at port ' + comm.Protocol.Port);
    this.socket.connect("http://localhost:" + comm.Protocol.Port, {'force new connection': true});
  };

  /**
   * Send message to server.
   * @param {string} msg - Message ID
   * @param {Object} params - Object map with message parameters
   */
  this.sendMessage = function (msg, params) {
    console.log('Sending message ' + msg);
    this.socket.emit(msg, params);
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
    else {
      console.log('Unknown message!');
      return;
    }

    this.updateUI();
  };

  /**
   * Handle reply - Guest player created
   * @param {Object} params - Message parameters
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
   * Request creating a new game.
   * @param {string} ruleName - Name of rule to use (eg. RuleBgCasual)
   */
  this.reqCreateGame = function (ruleName) {
    this.sendMessage(comm.Message.CREATE_GAME, {
      'ruleName': ruleName
    });
  };

  /**
   * Request joining a specific game.
   * @param {number} gameID - ID of game to join
   */
  this.reqJoinGame = function (gameID) {
    this.sendMessage(comm.Message.JOIN_GAME, {
      'gameID': gameID
    });
  };

  /**
   * Request starting game (if another player has already joined).
   */
  this.reqStartGame = function () {
    //this.updateGame(null);
    //this.updateRule(null);
    this.updateUI();
    this.sendMessage(comm.Message.START_GAME);
  };

  /**
   * Request rolling dice
   */
  this.reqRollDice = function () {
    this.sendMessage(comm.Message.ROLL_DICE);
  };

  /**
   * Confirm moves made
   */
  this.reqConfirmMoves = function () {
    this.sendMessage(comm.Message.CONFIRM_MOVES);
  };

  /**
   * Request moving a piece.
   * @param {number} position - Denormalized position from which a piece has to be moved
   * @param {PieceType} type - Type of piece (white/black) - used for validation
   * @param {number} steps - Number of steps to move forward to first home position
   */
  this.reqMove = function (position, type, steps) {
    this.sendMessage(comm.Message.MOVE_PIECE, {
      'position': position,
      'type': type,
      'steps': steps
    });
  };


  this.init(config);
}

module.exports.Client = Client;
