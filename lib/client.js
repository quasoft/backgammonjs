var model = require('./model.js');
var comm = require('./comm.js');
var io = require('socket.io-client');
require('../app/browser/js/SimpleBoardUI.js');
//require('SimpleBoardUI');
require('./rules/rule.js');
require('./rules/RuleBgCasual.js');
require('./rules/RuleBgGulbara.js');

/**
 * Backgammon client
 * @constructor
 */
function Client(config) {
  this.socket = null;
  this.player = null;
  this.game = null;
  this.rule = null;

  /**
   * Client configuration
   */
  this.config = {
    'containerID': 'backgammon',
    'boardID': 'board',
    'rulePath': './rules/',
    'boardUI': '../app/browser/js/SimpleBoardUI.js'
    //'boardUI': 'SimpleBoardUI'
  };

  /**
   * Initialize client
   */
  this.init = function (config) {
    for (var attrname in config) { this.config[attrname] = config[attrname]; }

    var boardUIClass = require(this.config.boardUI);
    this.boardUI = new boardUIClass(this);
    this.boardUI.init();

    this.openSocket();
    //this.connect();
  };

  /**
   * Prepare socket and attach message handlers
   */
  this.openSocket = function () {
    var self = this;

    this.socket = io.connect("http://localhost:" + comm.Protocol.Port, {'force new connection': true});

    this.socket.on(comm.Message.CONNECT, function(){
      self.handleConnect();
      self.update();
    });

    this.socket.on(comm.Message.CREATE_GUEST, function(player){
      self.handleCreateGuest(player);
      self.update();
    });

    this.socket.on(comm.Message.GET_GAME_LIST, function(list){
      self.handleGetGameList(list);
      self.update();
    });

    this.socket.on(comm.Message.CREATE_GAME, function(params){
      self.handleCreateGame(params);
      self.update();
    });

    this.socket.on(comm.Message.JOIN_GAME, function(params){
      self.handleJoinGame(params);
      self.update();
    });

    this.socket.on(comm.Message.START_GAME, function(params){
      self.handleStartGame(params);
      self.update();
    });

    this.socket.on(comm.Message.EVENT_PLAYER_JOINED, function(params){
      self.handleEventPlayerJoined(params);
      self.update();
    });

    this.socket.on(comm.Message.EVENT_TURN_START, function(params){
      self.handleEventTurnStart(params);
      self.update();
    });

    this.socket.on(comm.Message.ROLL_DICE, function(params){
      self.handleRollDice(params);
      self.update();
    });

  }

  /**
   * Connect to server
   */
  this.connect = function () {
    console.log('Connecting to server at port ' + comm.Protocol.Port);
    this.socket.connect("http://localhost:" + comm.Protocol.Port, {'force new connection': true});
  }

  /**
   * Send message to server
   * @param {string} Message ID
   * @param {object} Object map with message parameters
   */
  this.sendMessage = function (msg, params) {
    console.log('Sending message ' + msg);
    this.socket.emit(msg, params);
  };

  /**
   * Handle connection to server
   */
  this.handleConnect = function () {
    console.log('Client connected');

    if (!this.player) {
      this.sendMessage(comm.Message.CREATE_GUEST);
    }
  };

  /**
   * Guest player created
   */
  this.handleCreateGuest = function (player) {
    this.player = player;

    // TODO: update UI
    console.log('Created guest player (ID): ' + player.id);
  };

  /**
   * List of games returned
   */
  this.handleGetGameList = function (list) {
    // TODO: update UI
    console.log('List of games (IDs): ' + list.length);
  };

  /**
   * New game has been created
   */
  this.handleCreateGame = function (params) {
    if ((!params) || (!params.game)) {
      return;
    }
    console.log('Created game with ID ' + params.game.id + ' and rule ' + params.ruleName);

    this.game = params.game;
    this.rule = this.loadRule(params.ruleName);

    this.resetBoard(this.game, this.rule);
  };

  /**
   * Joined new game
   */
  this.handleJoinGame = function (params) {
    if ((!params) || (!params.game)) {
      return;
    }
    console.log('Joined game with ID ' + params.game.id + ' and rule ' + params.ruleName);

    this.game = params.game;
    this.rule = this.loadRule(params.ruleName);

    this.resetBoard(this.game, this.rule);
  };

  /**
   * Game started
   */
  this.handleStartGame = function (params) {
    console.log('Starting game ' + this.game.id + ' with rule ' + this.rule.name);

    //this.game.params = this.game;
    this.game.hasStarted = true;
    this.game.turnPlayer = params.game.turnPlayer;
  };

  /**
   * Another player joined game
   */
  this.handleEventPlayerJoined = function (params) {
    console.log('Player ' + params.player.id + ' joined game ' + this.game.id);

    model.Game.addGuestPlayer(this.game, params.player);
  };

  /**
   * New turn started
   */
  this.handleEventTurnStart = function (params) {
    console.log('Turn start');

    this.game.turnPlayer = params.turnPlayer;
  };

  /**
   * Dice rolled
   */
  this.handleRollDice = function (params) {
    this.game.turnDice = params.dice;
  };

  /**
   * Load rule module
   */
  this.loadRule = function (ruleName) {
    //var rule = model.Utils.loadRule(this.config.rulePath, ruleName);
    var fileName = model.Utils.sanitizeName(ruleName);
    var file = this.config.rulePath + fileName + '.js';
    var rule = require(file);
    rule.name = fileName;
    return rule;
  };

  /**
   * Init game
   */
  this.resetBoard = function (game, rule) {
    this.boardUI.resetBoard(game, rule);
  };

  /**
   * Update UI
   */
  this.update = function () {
    this.boardUI.update();
  };

  /**
   * Create game
   */
  this.reqCreateGame = function (ruleName) {
    this.sendMessage(comm.Message.CREATE_GAME, {
      'ruleName': ruleName
    });
  };

  /**
   * Join game
   * @param {Game} Game to join
   */
  this.reqJoinGame = function (gameID) {
    this.sendMessage(comm.Message.JOIN_GAME, {
      'gameID': gameID
    });
  };

  /**
   * Start game, if another player has joined.
   * @param {Game} Game to start
   */
  this.reqStartGame = function (gameID) {
    this.sendMessage(comm.Message.START_GAME);
  };

  /**
   * Roll dice
   * @param {Game} Game to start
   */
  this.reqRollDice = function (gameID) {
    this.sendMessage(comm.Message.ROLL_DICE);
  };

  /**
   * Request move
   * @param {PieceType} piece type
   */
  this.reqMove = function (type) {
    ;
  };

  this.init(config);
};
module.exports.Client = Client;
