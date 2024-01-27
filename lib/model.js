var crypto = require('crypto');

/**
 * Current version supports only two colours of checkers and two players as
 * the author is not yet aware of rules with three or more types of checkers
 * and/or players.
 * @readonly
 * @enum {number}
 */
var PieceType = {
  /** White piece */
  WHITE : 0,
  /** Black piece */
  BLACK : 1
};

/**
 * Common utilities
 * @constructor
 */
function Utils() {

}

/**
 * Generate unique ID for an object in model
 * @returns {number}
 */
Utils.generateID = function () {
  // TODO: Use a better approach - eg. a database ObjectID?
  return Math.floor(Math.random() * 99999999);
};

/**
 * Sanitize rule's name so that it is safe to use as a filename
 * @param {string} name - Rule's name to sanitize (eg. 'RuleBgCasual')
 * @returns {string}
 */
Utils.sanitizeName = function (name) {
  return name.replace(/[^-_A-Za-z0-9]/gi, "");
};

/**
 * Load rule object by path and class name
 * @param {string} path - Path where rule files are stored ('../../lib/rules/' in browser sample)
 * @param {string} ruleName - Name of rule - equal to rule's class name (eg. 'RuleBgCasual')
 * @returns {Rule} - Rule object
 */
Utils.loadRule = function (ruleName) {
  var path = './rules/';
  var fileName = Utils.sanitizeName(ruleName);
  var file = path + fileName + '.js';
  console.log('Loading rule in file ' + file);
  var rule = require(file);
  rule.name = fileName;
  console.log(rule);
  return rule;
};

/**
 * Extract item object from array
 * @param {Array} array - Array of elements
 * @param {Object} item - Element to remove from array
 * @returns {} - The element removed from array or null, if not found
 */
Utils.extractItem = function (array, item) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === item) {
      array.splice(i, 1);
      return;
    }
  }
};

/**
 * Remove item from array
 * @param {Array} array - Array of elements
 * @param {Object} item - Element to remove from array
 */
Utils.removeItem = function (array, item) {
  Utils.extractItem(array, item);
};

/**
 * Rotate array elements left.
 *
 * Example:
 * [6, 4, 1] becomes [4, 1, 6]
 *
 * @param {Array} array - Array of elements
 */
Utils.rotateLeft = function (array) {
  array.unshift(array.pop());
};

/**
 * Create shallow copy of object.
 *
 * @param {Object} oldObj - Object to copy
 * @returns {Object} - Shallow copy of object
 */
Utils.shallowCopy = function (oldObj) {
  var newObj = {};
  for(var i in oldObj) {
    if(oldObj.hasOwnProperty(i)) {
      newObj[i] = oldObj[i];
    }
  }
  return newObj;
};

/**
 * Create deep copy of a value object.
 * The object should have no functions/methods.
 *
 * @param {Object} oldObj - Object to copy
 * @returns {Object} - Deep copy of object
 */
Utils.deepCopy = function (oldObj) {
  return JSON.parse(JSON.stringify(oldObj));
};

/**
 * Simulate server load/hosting throttling
 *
 * @param {Object} oldObj - Object to copy
 * @returns {Object} - Deep copy of object
 */
Utils.simulateServerLoad = function () {
  for (var i = 0; i < 100000; i++) {
    for (var k = 1; k < 1000; k++) {
      var q = Math.sqrt(1000000007);
    }
  }
};

/**
 * Get random element from an array
 *
 * @param {Array} arr - Array to choose element from
 * @returns {Object} - Random element in array
 */
Utils.getRandomElement = function (arr) {
  var idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
};

/**
 * Check if array include (contains) a specific value
 *
 * @param {number[]} array - Array with numeric values to check
 * @param {number} value - Value to search for in array
 * @returns {boolean} - True if value is contained inside the array
 */
Utils.includes = function (array, value) {
  var i;
  for (i = 0; i < array.length; i++) {
    if (array[i] === value) {
      return true;
    }
  }

  return false;
};

/**
 * Random generator.
 * @constructor
 */
function Random() {

}

/**
 * Get random number from 1 to 6
 * @returns {number} - Random value from 1 to 6
 */
Random.get = function() {
  // TODO: replace with quality random generator

  // Combine Math random generator with crypto one
  var buffer = crypto.randomBytes(1);
  var value = buffer.readUInt8(0);
  console.log(value);
  if (value > 255) {
    value = 255;
  }
  var k = value / 256;

  return (Math.floor(k * 6) + 1);
};

/**
 * Pieces are round checkers that are being moved around the board.
 * @constructor
 * @param {PieceType} type - Type of piece
 * @param {number} id - ID of piece
 */
function Piece(type, id) {
  /**
   * Type of piece (white/black)
   * @type {PieceType}
   */
  this.type = type;

  /**
   * ID of piece
   * @type {number}
   */
  this.id = id;
}

/**
 * Dice with basic functionality to roll using good random generator.
 * @constructor
 */
function Dice() {
  /**
   * Values of the three dice
   * @type {Array}
   */
  this.values = [0, 0, 0];

  /**
   * List of moves the player can make. Usually moves are equal to values,
   * but in most rules doubles (eg. 6:6) are played four times, instead of
   * two, in which case moves array will contain four values in stead of
   * only two (eg. [6, 6, 6, 6]). With three dice, if all three match then 8
   * @type {Array}
   */
  this.moves = [];

  /**
   * After dice is rolled, movesLeft contains the same values as moves.
   * When the player makes a move, the corresponding value is removed from
   * movesLeft array. If the player wants to undo the moves made, movesLeft is
   * replaced with moves.
   * @type {Array}
   */
  this.movesLeft = [];

  /**
   * After a piece is moved, the value of the die used is added to movesPlayed array.
   * @type {Array}
   */
  this.movesPlayed = [];
}

/**
 * Roll dice and return result as a new Dice object
 * @returns {Dice} - New dice with random values
 */
Dice.roll = function() {
  var dice = new Dice();

  dice.values[0] = Random.get();
  dice.values[1] = Random.get();
  dice.values[2] = Random.get();
  dice.values.sort(function (a, b) { return b - a; });
  return dice;
};

/**
 * Roll dice and return result as a new Dice object
 * @param {Dice} dice - New dice with random values
 * @param {number} move - New dice with random values
 */
Dice.markAsPlayed = function (dice, move) {
  for (var i = 0; i < dice.movesLeft.length; i++) {
    if (dice.movesLeft[i] === move) {
      dice.movesPlayed.push(dice.movesLeft[i]);
      dice.movesLeft.splice(i, 1);
      return;
    }
  }
  throw new Error("No such move!");
};

// /**
//  * Check if the dice object has double (equal) values.
//  * @param {Dice} dice - New dice with random values
//  * @returns {boolean} - True if dice object has dobule values, false otherwise
//  */
// Dice.isDouble = function (dice) {
//   return dice.values[0] === dice.values[1] || dice.values[1] === dice.values[2] || dice.values[0] === dice.values[2];
// };

/**
 * Get remaining moves from dice object - moves that have not been played.
 * @param {Dice} dice - Dice object
 * @returns {Array} - Array containing remaining move values
 */
Dice.getRemainingMoves = function (dice) {
  var remaining = [];
  var played = [];
  played = played.concat(dice.movesPlayed);

  for (var i = 0; i < dice.moves.length; i++) {
    var index = played.indexOf(dice.moves[i]);
    if (index >= 0) {
      played.splice(index, 1);
    }
    else {
      remaining.push(dice.moves[i]);
    }
  }

  return remaining;
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
   * @type {Array}
   */
  this.points = [];

  /**
   * Height: if a piece(s) has moved vertically, store its new height here; index is
   * piece number
   */
  this.heightOverrides = [];

  /**
   * Players have separate bar places and so separate list.
   * First element of array is for white pieces and second one for black.
   * @type {Array[]}
   */
  this.bar = [[],[]];
  this.whiteBar = this.bar[PieceType.WHITE];
  this.blackBar = this.bar[PieceType.BLACK];

  /**
   * Players have separate outside places and so separate list.
   * First element of array is for white pieces and second one for black.
   * @type {Array[]}
   */
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

  /**
   * Counter for generating unique IDs for pieces within this state
   * @type {number}
   */
  this.nextPieceID = 1;
}

/**
 * Clear state
 * @param {State} state - Board state
 */
State.clear = function(state) {
  state.nextPieceID = 1;
  for (var i = 0; i < state.points.length; i++) {
    state.points[i].length = 0;
  }
  state.heightOverrides = [];
  state.whiteBar.length = 0;
  state.blackBar.length = 0;
  state.whiteOutside.length = 0;
  state.blackOutside.length = 0;
  state.whitePieces.length = 0;
  state.blackPieces.length = 0;
};

/**
 * Count number of pieces of specified type at selected position
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @param {PieceType} type - Piece type
 * @returns {number} - Number of pieces of specified type
 */
State.countAtPos = function(state, position, type) {
  var cnt = 0;

  for (var i = 0; i < state.points[position].length; i++) {
    if (state.points[position][i].type == type) {
      cnt++;
    }
  }

  return cnt;
};

/**
 * Count number of all pieces at selected position, regardless of type
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @returns {number} - Number of pieces of specified type
 */
State.countAllAtPos = function(state, position) {
  var cnt = 0;

  for (var i = 0; i < state.points[position].length; i++) {
    cnt++;
  }

  return cnt;
};

/**
 * Check if there are no pieces at the specified point
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @returns {boolean} - Returns true if there are no pieces at that point
 */
State.isPosFree = function(state, position) {
  return state.points[position].length <= 0;
};

/**
 * Get top piece, checking type in the process
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @param {PieceType} type - Piece type
 * @returns {boolean} - Returns true if top piece at position is of the specified type. Returns false if there are no pieces at that point.
 */
State.checkTopPieceType = function(state, position, type) {
  if (state.points[position].length > 0) {
    var numPieces = state.points[position].length;
    var piece = state.points[position][numPieces - 1];
    if (piece.type === type) {
      return true;
    }
  }

  return false;
};

/**
 * Get top piece at specified position
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @returns {Piece} - Returns type of top piece or null if there are no pieces at that position
 */
State.getTopPiece = function(state, position) {
  var point = state.points[position];
  //console.log(state, position);
  if (point.length === 0) {
    return null;
  }
  return point[point.length - 1];
};

/**
 * Get type of top piece at specified position
 * @param {State} state - Board state
 * @param {number} position - Denormalized point position
 * @returns {PieceType} - Returns type of top piece or null if there are no pieces at that position
 */
State.getTopPieceType = function(state, position) {
  var point = state.points[position];
  //console.log(state, position);
  if (point.length === 0) {
    return null;
  }
  return point[point.length - 1].type;
};

/**
 * Check if there are any pieces on the bar.
 * @param {State} state - State to check
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {boolean} - True if there are any pieces on the bar
 */
State.havePiecesOnBar = function(state, type) {
  return state.bar[type].length > 0;
};

/**
 * Check if a specific piece is on the bar.
 * @param {State} state - State to check
 * @param {Piece} piece - Piece
 * @returns {boolean} - True if there are any pieces on the bar
 */
State.isPieceOnBar = function(state, piece) {
  var bar = state.bar[piece.type];
  for (var i = 0; i < bar.length; i++) {
    if (bar[i].id === piece.id) {
      return true;
    }
  }
  return false;
};

/**
 * Check if the piece is outside.
 * @param {State} state - State to check
 * @param {Piece} piece - Piece
 * @returns {boolean} - True if there are any pieces on the bar
 */
State.isPieceOutside = function(state, piece) {
  var outside = state.outside[piece.type];
  for (var i = 0; i < outside.length; i++) {
    if (outside[i].id === piece.id) {
      return true;
    }
  }
  return false;
};

/**
 * Get top piece at bar
 * @param {State} state - Board state
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {Piece} - Returns type of top piece or null if there are no pieces at that position
 */
State.getBarTopPiece = function(state, type) {
  var point = state.bar[type];
  if (point.length === 0) {
    return null;
  }
  return point[point.length - 1];
};

/**
 * Get position of piece on board. Return null if the piece is on bar or outside the board.
 * @param {State} state - Game
 * @param {Piece} piece - Piece
 * @returns {number} - Position of piece on board or null if on bar/outside the board
 */
State.getPiecePos = function (state, piece) {
  var i, k;
  for (i = 0; i < state.points.length; i++) {
    for (k = 0; k < state.points[i].length; k++) {
      if (state.points[i][k].id === piece.id) {
        return i;
      }
    }
  }
  return null;
};

/**
 * Creates a deep copy of state object
 * @param {State} state - Game state
 * @returns {State} - New state object
 */
State.clone = function (state) {
  var newState = Utils.deepCopy(state);
  newState.whiteBar = newState.bar[PieceType.WHITE];
  newState.blackBar = newState.bar[PieceType.BLACK];
  newState.whiteOutside = newState.outside[PieceType.WHITE];
  newState.blackOutside = newState.outside[PieceType.BLACK];
  newState.whitePieces = newState.pieces[PieceType.WHITE];
  newState.blackPieces = newState.pieces[PieceType.BLACK];
  return newState;
};

State.rebuildRefs = function (state) {
  state.whiteBar = state.bar[PieceType.WHITE];
  state.blackBar = state.bar[PieceType.BLACK];
  state.whiteOutside = state.outside[PieceType.WHITE];
  state.blackOutside = state.outside[PieceType.BLACK];
  state.whitePieces = state.pieces[PieceType.WHITE];
  state.blackPieces = state.pieces[PieceType.BLACK];
};

/**
 * Player's statistics
 * @constructor
 */
function PlayerStats() {
  /**
   * Total number of wins
   * @type {number}
   */
  this.wins = 0;

  /**
   * Total number of loses
   * @type {number}
   */
  this.loses = 0;

  /**
   * Percent of doubles rolled relative to total number of dice rolled
   * @type {number}
   */
  this.doubles = 0;
}

/**
 * Player
 * @constructor
 */
function Player() {
  /**
   * Unique ID
   * @type {number}
   */
  this.id = 0;

  /**
   * Username
   * @type {string}
   */
  this.name = '';

  /**
   * Reference to current match
   * @type {Match}
   */
  this.currentMatch = null;

  /**
   * Reference to rule for current game
   * @type {Rule}
   */
  this.currentRule = null;

  /**
   * Player's piece type for current game
   * @type {PieceType}
   */
  this.currentPieceType = null;

  /**
   * Player's statistics
   * @type {PlayerStats}
   */
  this.stats = new PlayerStats();

  // TODO: Remove socketID from this class
  /**
   * ID of player's socket
   * @type {string}
   */
  this.socketID = null;
}

/**
 * Create new player object with unique ID.
 * Player object is not saved to database.
 * @returns {Player} - New player object
 */
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
  /**
   * Unique ID of game
   * @type {number}
   */
  this.id = 0;

  /**
   * Board state
   * @type {State}
   */
  this.state = null;

  /**
   * Flag that shows if game has started
   * @type {boolean}
   */
  this.hasStarted = false;

  /**
   * Flag that shows if game is over/has finished
   * @type {boolean}
   */
  this.isOver = false;

  /**
   * Number (index) of turn
   * @type {number}
   */
  this.turnNumber = 0;

  /**
   * Show which player's turn it is
   * @type {Player}
   */
  this.turnPlayer = null;

  /**
   * Dice for current turn. Should be null if dice haven't been rolled yet.
   * @type {Dice}
   */
  this.turnDice = null;

  /**
   * Flag that shows if the moves made in current turn have been confirmed by the player.
   * @type {boolean}
   */
  this.turnConfirmed = false;

  /**
   * Previous game state, used for undoing moves
   */
  this.previousState = null;

  /**
   * Previous dice state, used for undoing moves
   */
  this.previousTurnDice = null;

  /**
   * Sequence number that is incremented each time a piece is moved during the game
   */
  this.moveSequence = 0;
}

/**
 * Create new game object with unique ID and initialize it.
 * Game object is not saved in database.
 * @param {Rule} rule - Rule object to use
 * @returns {Game} - A new game object with unique ID
 */
Game.createNew = function(rule) {
  var game = new Game();
  game.id = Utils.generateID();
  Game.init(game, rule);
  return game;
};

/**
 * Initialize game object
 * @param {Game} game - Game to initialize
 * @param {Rule} rule - Rule to use
 */
Game.init = function (game, rule) {
  game.state = new State();
  rule.initialize(game.state);
  rule.resetState(game.state);
};

/**
 * Check if it is specified player's turn
 * @param {Game} game - Game
 * @param {Player} player - Specified player
 * @returns {boolean} - True if it is specified player's turn
 */
Game.isPlayerTurn = function (game, player) {
  return (game.turnPlayer) &&
    (player) &&
    (game.turnPlayer.id === player.id);
};

/**
 * Check if it is specified player's turn, but check by their piece type, and not player object
 * @param {Game} game - Game
 * @param {PieceType} type - Player's piece type
 * @returns {boolean} - True if it is specified player's turn
 */
Game.isTypeTurn = function (game, type) {
  return (game.turnPlayer) &&
    (game.turnPlayer.currentPieceType === type);
};

/**
 * Check if dice has been rolled
 * @param {Game} game - Game
 * @returns {boolean} - True if dice has been rolled (turnDice is not null)
 */
Game.diceWasRolled = function (game) {
  return (game.turnDice != null);
};

/**
 * Check if there are more moves to make
 * @param {Game} game - Game
 * @returns {boolean} - True if there are any moves left to make
 */
Game.hasMoreMoves = function (game) {
  return (game.turnDice) &&
    (game.turnDice.movesLeft.length > 0);
};

/**
 * Check if a specific move value is available in movesLeft
 * @param {Game} game - Game
 * @param {number} value - Move value to check for
 * @returns {boolean} - True if specified move value is available
 */
Game.hasMove = function (game, value) {
  return (game.turnDice) &&
    (game.turnDice.movesLeft.indexOf(value) > -1);
};

/**
 * Store current game state - in case the player wants to undo moves later
 * @param {Game} game - Game
 */
Game.snapshotState = function (game) {
  game.previousState = State.clone(game.state);
  game.previousTurnDice = Utils.deepCopy(game.turnDice);
};

/**
 * Restore game state from last snapshot - if player requested to undoing of moves
 * @param {Game} game - Game
 */
Game.restoreState = function (game) {
  game.state = State.clone(game.previousState);
  game.turnDice = Utils.deepCopy(game.previousTurnDice);
};

/**
 * Match
 * @constructor
 */
function Match() {
  /**
   * Unique ID of match object
   * @type {number}
   */
  this.id = 0;

  /**
   * Player that created the match
   * @type {Player}
   */
  this.host = null;

  /**
   * Player that joined the match
   * @type {Player}
   */
  this.guest = null;

  /**
   * List of IDs of all players participating in the match
   * @type {Array}
   */
  this.players = [];

  /**
   * Name of the rule used for current match.
   * Equals the class name of the rule (eg. 'RuleBgCasual').
   * @type {string}
   */
  this.ruleName = '';

  /**
   * Match length - the score needed to win the match.
   * @type {number}
   */
  this.length = 5;

  /**
   * Score of players for current match
   * @type {Array}
   */
  this.score = [];

  /**
   * Current game
   * @type {Game}
   */
  this.currentGame = null;

  /**
   * Is match over
   * @type {boolean}
   */
  this.isOver = false;
}

/**
 * Create new match object with unique ID and initialize it.
 * Match object is not saved in database.
 * @param {Rule} rule - Rule object to use
 * @returns {Match} - A new match object with unique ID
 */
Match.createNew = function(rule) {
  var match = new Match();
  match.id = Utils.generateID();
  match.ruleName = rule.name;
  match.score = [0, 0];
  return match;
};

/**
 * Create new game for this match. Fill game object with data from match
 * Game object is not saved in database.
 * @param {Rule} rule - Rule object to use
 * @returns {Match} - A new match object with unique ID
 */
Match.createNewGame = function(match, rule) {
  var game = Game.createNew(rule);
  match.currentGame = game;
  return game;
};

/**
 * Add host player to match
 * @param {Match} match - Match to add player to
 * @param {Player} player - Player to add
 * @throws Throws error if the match already has a host player
 */
Match.addHostPlayer = function (match, player) {
  if (match.host)
  {
    throw new Error("Match already has a host player!");
  }

  match.host = player;
  match.players.push(player.id);
};

/**
 * Add guest player
 * @param {Match} match - Match to add player to
 * @param {Player} player - Player to add
 * @throws Throws error if the match already has a guest player
 */
Match.addGuestPlayer = function (match, player) {
  if (match.guest)
  {
    throw new Error("Match already has a guest player!");
  }

  match.guest = player;
  match.players.push(player.id);
};

/**
 * Check if specified player is the host of the match
 * @param {Match} match - Match
 * @param {Player} player - Specified player
 * @returns {boolean} - True if there is a host player and their ID matches that of the player parameter
 */
Match.isHost = function (match, player) {
  return (match.host) &&
    (player) &&
    (match.host.id === player.id);
};

/**
 * Check if another player has joined the match
 * @param {Match} match - Match
 * @returns {boolean} - True if a another player has joined the match
 */
Match.hasGuestJoined = function (match) {
  return (match.guest != null);
};

/**
 * Move action types are determined by rules. This is only a default list
 * of actions that are shared by most rules.
 * @readonly
 * @enum {string}
 */
var MoveActionType = {
  /** MOVE: Move piece from one point to another */
  MOVE: 'move',
  /** RECOVER: Recover piece from bar and place it on board */
  RECOVER: 'recover',
  /** HIT: Hit opponent's piece and sent it to bar */
  HIT: 'hit',
  /** BEAR: Bear piece - move it outside the board */
  BEAR: 'bear',
  /** UP: Move vertically to pass a tower */
  UP: 'up',
};

/**
 * Actions that can result from making a piece move.
 * Rules can assign additional properties to those, depending on the action
 * type
 * @constructor
 */
function MoveAction() {
  /**
   * Action type, depends on rule (eg. move, bear, hit)
   * @type {MoveActionType|string}
   */
  this.type = '';
}

module.exports = {
  'PieceType': PieceType,
  'Utils': Utils,
  'Random': Random,
  'Piece': Piece,
  'Dice': Dice,
  'State': State,
  'PlayerStats': PlayerStats,
  'Player': Player,
  'Game': Game,
  'Match': Match,
  'MoveActionType': MoveActionType,
  'MoveAction': MoveAction
};
