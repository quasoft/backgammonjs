//require('./rules/rule.js');
//require('./rules/bg-casual.js');
//require('./rules/bg-gul-bara.js');

/**
 * Current version supports only two colours of checkers and two players as
 * the author is not yet aware of rules with three or more types of checkers
 * and/or players.
 */
var PieceType = {
  WHITE : 0,
  BLACK : 1
};

/**
 * Denotes direction of piece movement relative to initial position.
 * LEFT: from initial position to left (then to right on opposite side of board)
 * RIGHT: from initial position to right (then to left on opposite side of board)
 */
var Direction = {
  LEFT : 0,
  RIGHT : 1
};

/**
 * Random generator.
 * @constructor
 */
function Random() {
  ;
};
Random.get = function(max) {
  max = max || 6;
  return Math.floor(Math.random() * max) + 1;
};

/**
 * Pieces are round checkers that are being moved around the board.
 * @constructor
 */
function Piece(type, id) {
  this.type = type;
  this.id = id;
};

/**
 * Dice with basic functionality to roll using good random generator.
 * Not extensible for now and supports only dices/values.
 * @constructor
 */
function Dice() {
  this.values = [0, 0];
  this.moves = [];
};
Dice.roll = function() {
  var dice = new Dice();
  dice.values[0] = Random.get();
  dice.values[1] = Random.get();
  return dice;
};

/**
 * State contains points and pieces and very basic methods to move pieces
 * around without enforcing any rules. Those methods are responsible for
 * required changes to internal state only, the UI layer should handle
 * graphical movement of pieces itself.
 * @constructor
 */
function State() {
  /**
   * All popular variants of the game have a total of 24 positions on the board
   * and two positions outside - the place on the bar where pieces go when
   * hit and the place next to board where pieces go when beared off.
   * Number of positions is not strictly defined here to allow more options
   * when creating new rules.
   * The points, bar, home and pieces properties should be initialized by the
   * Rule object. Each element in those properties should contain a stack
   * (last in, first out).
   */
  this.points = [];

  /**
   * Players have separate bar and home places and so separate list.
   * First element of array is for white pieces and second one for black.
   */
  this.bar = [[],[]];
  this.whiteBar = this.bar[PieceType.WHITE];
  this.blackBar = this.bar[PieceType.BLACK];

  this.home = [[],[]];
  this.whiteHome = this.home[PieceType.WHITE];
  this.blackHome = this.home[PieceType.BLACK];

  /**
   * A two dimensional array is also used to store references to all white and
   * black pieces independent of their position - just for convenience.
   */
  this.pieces = [[],[]];
  this.whitePieces = this.pieces[PieceType.WHITE];
  this.blackPieces = this.pieces[PieceType.BLACK];

  this.nextPieceID = 1;
};

/**
 * Clear state
 * @param {Backgammon.State} Board state
 */
State.clear = function(state) {
  state.nextPieceID = 1;
  for (var i = 0; i < state.points.length; i++) {
    state.points[i].length = 0;
  }
  state.whiteBar.length = 0;
  state.blackBar.length = 0;
  state.whiteHome.length = 0;
  state.blackHome.length = 0;
  state.whitePieces.length = 0;
  state.blackPieces.length = 0;
};

/**
 * Player Statistics
 * @constructor
 */
function PlayerStats() {
  this.wins = 0;
  this.loses = 0;
  this.doubles = 0;
};

/**
 * Player
 * @constructor
 */
function Player() {
  this.id = 0;
  this.name = '';
  this.currentGame = null;
  this.stats = new PlayerStats();
};
Player.createNew = function() {
  var player = new Player();
  player.id = Utils.generateID();
  return player;
};

/**
 * Game
 * @constructor
 */
function Game() {
  this.id = 0;
  this.host = null;
  this.guest = null;
  this.players = [this.host, this.guest];
  this.ruleName = '';
  this.rule = null;
  this.state = null;

  /**
   * Add host player to game
   * @param {Backgammon.Player} Player to add
   */
  this.addHostPlayer = function (player) {
    if (this.host != null)
    {
      throw "Game already has a host player!";
    }

    this.host = player;
  };

  /**
   * Add guest player
   * @param {Backgammon.Player} Player to add
   */
  this.addGuestPlayer = function (player) {
    if (this.guest != null)
    {
      throw "Game already has a guest player!";
    }

    this.guest = player;
  };

  /**
   * Initalize game object
   */
  this.init = function () {
    this.state = new State();
    this.rule.initialize(this.state);
    this.rule.resetState(this.state);
  };

};
/**
 * Create new game object and initialize it
 * @param {Rule} Rule
 */
Game.createNew = function(rule) {
  var game = new Game();
  game.id = Utils.generateID();
  game.rule = rule;
  game.init();
  return game;
};

/**
 * Common utilities
 * @constructor
 */
function Utils() {
  ;
};
Utils.generateID = function () {
  return Random.get(99999999);
};
Utils.sanitizeName = function (name) {
  return name.replace(/[^-_A-Za-z0-9]/gi, "");
};
Utils.loadRule = function (path, ruleName) {
  var file = path + Utils.sanitizeName(ruleName) + '.js';
  console.log('Loading rule in file ' + file);
  var rule = require(file);
  console.log(rule);
  return rule;
};

module.exports = {
  'PieceType': PieceType,
  'Direction': Direction,
  'Random': Random,
  'Piece': Piece,
  'Dice': Dice,
  'State': State,
  'PlayerStats': PlayerStats,
  'Player': Player,
  'Game': Game,
  'Utils': Utils
};
