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
 * @constructor
 */
function Dice() {
  // Values of the two dice
  this.values = [0, 0];

  // List of moves the player can make. Usually moves are equal to values,
  // but in most rules doubles (eg. 6:6) are played four times, instead of
  // two, in which case moves array will contain four values in stead of
  // only two (eg. [6, 6, 6, 6]).
  this.moves = [];

  // After dice is rolled, movesLeft contains the same values as moves.
  // When the player makes a move, the corresponding value is removed from
  // movesLeft array. If the player wants to undo the moves made, movesLeft is
  // replaced with moves.
  this.movesLeft = [];
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
   * The points, bar, outside and pieces properties should be initialized by the
   * Rule object. Each element in those properties should contain a stack
   * (last in, first out).
   */
  this.points = [];

  /**
   * Players have separate bar and outside places and so separate list.
   * First element of array is for white pieces and second one for black.
   */
  this.bar = [[],[]];
  this.whiteBar = this.bar[PieceType.WHITE];
  this.blackBar = this.bar[PieceType.BLACK];

  this.outside = [[],[]];
  this.whiteOutside = this.outside[PieceType.WHITE];
  this.blackOutside = this.outside[PieceType.BLACK];

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
  state.whiteOutside.length = 0;
  state.blackOutside.length = 0;
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
  this.currentRule = null;
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
  this.players = [];
  this.ruleName = '';
  this.state = null;
  this.hasStarted = false;
  this.isOver = false;
  this.turnPlayer = null;
  this.turnDice = null;
  this.turnConfirmed = null;
  // - has dice been rolled?
  // - have more moves to make?
  // - have confirmed moves?
};

/**
 * Internal state of game.
 */
var GameState = {
  NEW : 0,
  STARTED : 1,
  FINISHED : 2
};

/**
 * Create new game object and initialize it
 * @param {Rule} Rule
 */
Game.createNew = function(rule) {
  var game = new Game();
  game.id = Utils.generateID();
  game.ruleName = rule.name;
  Game.init(game, rule);
  return game;
};

/**
 * Add host player to game
 * @param {Backgammon.Game} Game to add player to
 * @param {Backgammon.Player} Player to add
 */
Game.addHostPlayer = function (game, player) {
  if (game.host != null)
  {
    throw "Game already has a host player!";
  }

  game.host = player;
  game.players.push(player);
};

/**
 * Add guest player
 * @param {Backgammon.Game} Game to add player to
 * @param {Backgammon.Player} Player to add
 */
Game.addGuestPlayer = function (game, player) {
  if (game.guest != null)
  {
    throw "Game already has a guest player!";
  }

  game.guest = player;
  game.players.push(player);
};

/**
 * Initalize game object
 * @param {Backgammon.Game} Game
 * @param {Backgammon.Rule} Rule
 */
Game.init = function (game, rule) {
  game.state = new State();
  rule.initialize(game.state);
  rule.resetState(game.state);
};

/**
 * Check if specified player is the host of the game
 * @param {Backgammon.Game} Game
 * @param {Backgammon.Player} Specified player
 */
Game.isHost = function (game, player) {
  return (game.host != null)
    && (player != null)
    && (game.host.id == player.id);
}

/**
 * Check if another player has joined the game
 * @param {Backgammon.Game} Game
 */
Game.hasGuestJoined = function (game) {
  return (game.guest != null);
}

/**
 * Check if it is specified player's turn
 * @param {Backgammon.Game} Game
 * @param {Backgammon.Player} Specified player
 */
Game.isPlayerTurn = function (game, player) {
  return (game.turnPlayer != null)
    && (player != null)
    && (game.turnPlayer.id == player.id);
}

/**
 * Check if dice has been rolled
 * @param {Backgammon.Game} Game
  */
Game.diceWasRolled = function (game) {
  return (game.turnDice != null);
}

/**
 * Check if there are more moves to make
 * @param {Backgammon.Game} Game
  */
Game.hasMoreMoves = function (game) {
  return (game.turnDice != null)
    && (game.turnDice.movesLeft.length > 0);
}

/**
 * Match
 * @constructor
 */
function Match() {
  this.id = 0;
  this.host = null;
  this.guest = null;
  this.players = [];
  this.ruleName = '';
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
  var fileName = Utils.sanitizeName(ruleName);
  var file = path + fileName + '.js';
  console.log('Loading rule in file ' + file);
  var rule = require(file);
  rule.name = fileName;
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
  'GameState': GameState,
  'Game': Game,
  'Match': Match,
  'Utils': Utils
};
