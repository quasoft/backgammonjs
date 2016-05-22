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
 * Reset state to initial position of pieces.
 */
RuleBgCasual.prototype.resetState = function(state) {
  /**
   * Move pieces to correct initial positions for both players.
   * Values in state.points are zero based and denote the .
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

  model.State.clear(state);

  this.place(state, 5, model.PieceType.WHITE, 5);
  this.place(state, 3, model.PieceType.WHITE, 7);
  this.place(state, 5, model.PieceType.WHITE, 12);
  this.place(state, 2, model.PieceType.WHITE, 23);

  this.place(state, 5, model.PieceType.BLACK, 18);
  this.place(state, 3, model.PieceType.BLACK, 16);
  this.place(state, 5, model.PieceType.BLACK, 11);
  this.place(state, 2, model.PieceType.BLACK, 0);
};

// . Determine new position
// . Validate whole move

/**
 * Increment position by specified number of steps
 */
RuleBgCasual.prototype.incPos = function(position, type, steps) {
  var newPosition;
  if (piece.PieceType == model.PieceType.WHITE) {
    newPosition = position - steps;
  }
  else {
    newPosition = position + steps;
  }

  return newPosition;
};

/**
 * Normalize position - Normalized positions start from 0 to 23 for both players,
 * where 0 is the first position in the home part of the board, 6 is the last
 * position in the home part and 23 is the furthest position - in the opponent's
 * home.
 */
RuleBgCasual.prototype.normPos = function(position, type) {
  var normPosition = position;

  if (type == model.PieceType.BLACK) {
    normPosition = 23 - position;
  }
  return normPosition;
};

/**
 * Move piece by specified number of steps without enforcing any rules.
 */
RuleBgCasual.prototype.moveBy = function(position, type, steps) {
  var piece = this.getPoint(position).pop();
  if (piece != null) {
    if (piece.PieceType === type) {

      // Determine new piece position
      var newPosition = this.incPos(position, type, steps);

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

/**
 * Validate piece move.
 *
 * If at least one piece is not home, move is considered valid if:
 * - HaveNoPiecesOnBar
 * - PieceIsMovable
 * - PointIsInsideBoard
 * - PointIsUnoccupied
 * -
 * - DestinationIsOutsideBoard
 * - AllPiecesAreHome
 * -
 *
 * If all pieces are home, move is considered valid if:
 *
 *
 * Validate piece placement:
 * -
 */
 RuleBgCasual.prototype.validateMove = function(position, type, steps) {
   if (HasPiecesOnBar) {
     var destination = null;
     // If there are pieces on the bar, the player can only place pieces on
     // board
     if (piece.PieceType == model.PieceType.WHITE) {
       destination = steps - 1;
     }
     else {
       destination = 24 - steps;
     }
   }
   else if (AllPiecesAreHome) {
     var destination = this.incPos(position, type, steps);
     var normDestination = this.normPosition(destination);
     if (normDestination == 0) {
       // can bear off
       return true;
     }
     // If all pieces are home, player can move or bear pieces
     if (this.normPos(position) == steps) {

     }
   }
   else {
     var destination = this.incPos(position, type, steps);
     // If at least one piece is not home, player can only move or place pieces
   }


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
