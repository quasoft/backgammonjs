var model = require('../model.js');
console.log(model);

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
 * Initialize board.
 */
Rule.prototype.initialize = function(board) {
  board.clear();

  // Create points
  board.points.length = 0;
  for (var i = 0; i < this.maxPoints; i++) {
    var point = new model.Point();
    point.number = i;
    board.points.push(point);
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
 * Reset board to initial position of pieces.
 * @abstract
 */
Rule.prototype.resetBoard = function(board) {
  throw new Error("Abstract method!");
};

/**
 * Move piece without enforcing any rules.
 * @abstract
 */
Rule.prototype.move = function(board) {
  throw new Error("Abstract method!");
};

module.exports = Rule;
