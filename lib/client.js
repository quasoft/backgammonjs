var model = require('./model.js');
var comm = require('./comm.js');
var io = require('socket.io-client');
require('../app/browser/js/simplegui.js');
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

  /**
   * Client configuration
   */
  this.config = {
    'containerID': 'backgammon',
    'boardID': 'board',
    'rulePath': './rules/',
    'guiPath': '../app/browser/js/simplegui.js'
  };

  /**
   * Initialize client
   */
  this.init = function (config) {
    for (var attrname in config) { this.config[attrname] = config[attrname]; }

    var guiClass = require(this.config.guiPath);
    this.gui = new guiClass(this);
    this.gui.init();

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
    });
    
    this.socket.on(comm.Message.CREATE_GUEST, function(player){
      self.handleCreateGuest(player);
    });

    this.socket.on(comm.Message.GET_GAME_LIST, function(list){
      self.handleGetGameList(list);
    });
    
    this.socket.on(comm.Message.CREATE_GAME, function(params){
      self.handleCreateGame(params);
    });
    
    this.socket.on(comm.Message.JOIN_GAME, function(params){
      self.handleJoinGame(params);
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
          
    // TODO: update GUI
    console.log('Created guest player (ID): ' + player.id);
  };
  
  /**
   * List of games returned
   */
  this.handleGetGameList = function (list) {      
    // TODO: update GUI
    console.log('List of games (IDs): ' + list.length);
  };
  
  /**
   * New game has been created
   */
  this.handleCreateGame = function (params) {
    console.log('Created game with ID ' + params.gameID + ' and rule ' + params.ruleName);
    
    var rule = this.loadRule(params.ruleName);  
    var game = model.Game.createNew(rule);
    game.addHostPlayer(this.player);
    this.player.currentGame = game.id;
    this.startGame(game);
  };
  
  /**
   * Joined new game
   */
  this.handleJoinGame = function (params) {
    if (!params) {
      return;
    }
    console.log('Joined game with ID ' + params.gameID + ' and rule ' + params.ruleName);
    
    var rule = this.loadRule(params.ruleName);  
    var game = model.Game.createNew(rule);
    game.addHostPlayer(params.hostPlayer);
    game.addGuestPlayer(this.player);
    this.player.currentGame = game.id;
    this.startGame(game);
  };
  
  /**
   * Load rule module
   */
  this.loadRule = function (ruleName) {
    var file = this.config.rulePath + model.Utils.sanitizeName(ruleName) + '.js';
    return require(file);
  };  
  
  /**
   * Init game
   */
  this.startGame = function (game) {
    this.gui.startGame(game);
  };

  /**
   * Create game
   */
  this.reqCreateGame = function (ruleName) {
    this.sendMessage(comm.Message.CREATE_GAME, {
      'playerID': this.player.id,
      'ruleName': ruleName
    });
  };

  /**
   * Join game
   * @param {Game} Game to join
   */
  this.reqJoinGame = function (gameID) {
    this.sendMessage(comm.Message.JOIN_GAME, {
      'playerID': this.player.id,
      'gameID': gameID
    });
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
