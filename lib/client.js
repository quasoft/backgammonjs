var model = require('./model.js');
var comm = require('./comm.js');
var io = require('socket.io-client');
require('../app/browser/js/simplegui.js');
require('./rules/rule.js');
require('./rules/bg-casual.js');
require('./rules/bg-gul-bara.js');

/**
 * Backgammon client
 * @constructor
 */
function Client(config) {
  this.socket = null;
  this.player = model.Player.createNew();

  /**
   * Client configuration
   */
  this.config = {
    'containerID': 'backgammon',
    'boardID': 'board',
    'rulePath': './rules/bg-casual.js',
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
    this.connect();
  };

  this.openSocket = function () {
    this.socket = io();

    this.socket.on(comm.Message.CONNECT, function(){
      console.log('MSG_CONNECT');
    });

    this.socket.on(comm.Message.GET_GAME_LIST, function(msg){
      $('#messages').append($('<li>').text(msg));
    });
  }

  this.connect = function () {
    console.log(comm.Protocol.Port);
    this.socket.connect("http://localhost:" + comm.Protocol.Port, {'force new connection': true});
  }

  /**
   * Create game
   */
  this.createGame = function (rulePath) {
    var rule = require(rulePath || this.config.rulePath);
    var game = new model.Game.createNew(rule);
    game.addHostPlayer(this.player);
    this.startGame(game);
    return game;
  };

  /**
   * Join game
   * @param {Game} Game to join
   */
  this.joinGame = function (game) {
    game.addGuestPlayer(this.player);
    this.startGame(game);
  };

  /**
   * Init game
   */
  this.startGame = function (game) {
    this.gui.startGame(game);
  };

  /**
   * Request move
   * @param {PieceType} piece type
   */
  this.requestMove = function (type) {
    ;
  };

  this.init(config);
};
module.exports.Client = Client;
