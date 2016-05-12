var model = require('../model.js');

/**
 * Rules define specific characteristics of each variant of the game.
 * All rules should inherit from this base class and define the following
 * properties:
 * - Maximum number of points (usually 26 - 24 on board, one on bar, and one outside)
 * - Maximum number of checkers (usually 15 per player/colour)
 * and methods for:
 * - Rolling dice (and a list of moves the player has to make
 *   after drawing a specific dice)
 * - Reset board to initial position of pieces.
 * - Validating a move
 * - Checking if game has ended
 * - Checking which player won
 * - Checking how much points the player won
 * @constructor
 * @abstract
 */
function Rule() {
  if (this.constructor === Rule) {
    throw new Error("Can't instantiate abstract class!");
  }

  this.title = "";
  this.description = "";
  this.country = "";
  this.countryCode = "";

  this.maxPoints = 24;
  this.maxPieces = 15;

  // TODO: FIX UNCOMMENT THIS
  this.whiteDirection = model.Direction.LEFT;
  this.blackDirection = model.Direction.RIGHT;

  // Most distant position of player with any pieces on it
  //this.whiteStart = 0;
  //this.blackStart = 0;
};

/**
 * Initialize board state.
 */
Rule.prototype.initialize = function(state) {
  model.State.clear(state);

  // Create points
  state.points.length = 0;
  for (var i = 0; i < this.maxPoints; i++) {
    var point = [];
    state.points.push(point);
  }
};

/**
 * Roll dice and generate list of moves the player has to make according to
 * current rules.
 * @abstract
 */
Rule.prototype.rollDice = function() {
  // Create dice object with 2 random values
  var dice = model.Dice.roll();

  // Add those values to moves list - the individual moves the player has to make
  dice.moves.push(dice.values);

  // Dices with equal values are played four times, so add two more moves
  if (dice.moves[0] == dice.moves[1]) {
    dice.moves.push(dice.values);
  }

  // Sort moves in descending order for convenience later in enforcing
  // move rules
  dice.moves.sort(function(a, b){return b-a});

  return dice;
};

/**
 * Reset state to initial position of pieces.
 * @param {Backgammon.State} Board state
 * @abstract
 */
Rule.prototype.resetState = function(state) {
  throw new Error("Abstract method!");
};

/**
 * Place one or more pieces from player set to board point.
 * @param {Backgammon.State} Board state
 * @param {integer} Position from which to take the piece
 * @param {integer} Position to which to move the piece to
 */
Rule.prototype.place = function (state, number, type, position) {
  for (var i = 0; i < number; i++) {
    var piece = new model.Piece(type, state.nextPieceID);
    state.pieces[type].push(piece);
    state.points[position].push(piece);
    state.nextPieceID++;
  }

  return true;
};

/**
 * Move piece to specified point, without enforcing any rules.
 * @param {Backgammon.State} Board state
 * @param {integer} Position from which to take the piece
 * @param {integer} Position to which to move the piece to
 */
Rule.prototype.move = function(state, fromPos, toPos) {
  var piece = state.points[fromPos].pop();
  if (piece != null) {
    state.points[toPos].push(piece);
    return true;
  }

  return false;
};

/**
 * Bear piece from board to home
 * @param {Backgammon.State} Board state
 * @param {integer} Position from which to take the piece
 * @param {integer} Number of steps to move the piece
 */
Rule.prototype.bear = function (state, position, type) {
  var piece = state.points[position].pop();
  if (piece != null) {
    if (piece.PieceType === type) {
      state.home[type].push(piece);
      return true;
    }

    state.points[position].push(piece);
  }

  return false;
};

/**
 * Hit piece = send piece to bar
 * @param {Backgammon.State} Board state
 * @param {integer} Position from which to take the piece
 * @param {integer} Type of piece (white/black) that is being hit
 */
Rule.prototype.hit = function (state, position, type) {
  var piece = state.points[position].pop();
  if (piece != null) {
    if (piece.PieceType === type) {
      state.bar[type].push(piece);
      return true;
    }

    state.points[position].push(piece);
  }

  return false;
};

module.exports = Rule;
