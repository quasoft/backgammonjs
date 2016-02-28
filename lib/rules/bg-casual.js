var model = require('../model.js');
var Rule = require('./rule.js');

/**
 * Most popular variant played in Bulgaria called casual (обикновена).
 */
function RuleBgCasual() {
  Rule.call(this);

  this.title = "General";
  this.description = "Most popular variant of backgammon played in Bulgaria.";
  this.country = "Bulgaria";
  this.countryCode = "bg";
};

RuleBgCasual.prototype = Object.create(Rule.prototype);
RuleBgCasual.prototype.constructor = RuleBgCasual;

/**
 * Roll dice and generate list of moves the player has to make according to
 * current rules.
 */
RuleBgCasual.prototype.rollDice = function() {
  return Rule.prototype.rollDice.call(this);
};

/**
 * Reset board to initial position of pieces.
 */
RuleBgCasual.prototype.resetBoard = function(board) {
  /**
   * Move pieces to correct initial positions for both players.
   * Values in board.points are zero based and denote the .
   * the number of pieces on each position.
   * Index 0 of array is position 1 and increments to the number of maximum
   * points.
   *
   * Position: |12 13 14 15 16 17| |18 19 20 21 22 23| White
   *           |5w          3b   | |5b             2w| <-
   *           |                 | |                 |
   *           |                 | |                 |
   *           |                 | |                 |
   *           |5b          3w   | |5w             2b| <-
   * Position: |11 10 09 08 07 06| |05 04 03 02 01 00| Black
   *
   */

  board.clear();

  board.place(5, model.PieceType.WHITE, 5);
  board.place(3, model.PieceType.WHITE, 7);
  board.place(5, model.PieceType.WHITE, 12);
  board.place(2, model.PieceType.WHITE, 23);

  board.place(5, model.PieceType.BLACK, 18);
  board.place(3, model.PieceType.BLACK, 16);
  board.place(5, model.PieceType.BLACK, 11);
  board.place(2, model.PieceType.BLACK, 0);
};

// . Determine new position
// . Validate whole move

/**
 * Move piece without enforcing any rules.
 */
RuleBgCasual.prototype.move = function(position, type, steps) {
  var piece = this.getPoint(position).pop();
  if (piece != null) {
    if (piece.PieceType === type) {

      // Determine new piece position
      var newPosition;
      if (piece.PieceType == model.PieceType.WHITE) {
        newPosition = position - steps;
      }
      else {
        newPosition = position + steps;
      }

      // Check if piece can be moved to that position
      if ((newPosition >= 0) || (newPosition <= 23)) {
        this.getPoint(newPosition).push(piece);
        return true;
      }
    }
  }

  this.getPoint(position).push(piece);
  return false;
};

module.exports = new RuleBgCasual();
