var model = require('../model.js');
var Rule = require('./rule.js');

/**
 * One of the less popular variants of backgammon in Bulgaria (гюлбара).
 */
function RuleBgGulbara() {
  Rule.call(this);

  this.title = "Gul bara";
  this.description = "One of the less popular variants of backgammon in Bulgaria.";
  this.country = "Bulgaria";
  this.countryCode = "bg";
};

RuleBgGulbara.prototype = Object.create(Rule.prototype);
RuleBgGulbara.prototype.constructor = RuleBgGulbara;

/**
 * Roll dice and generate list of moves the player has to make according to
 * current rules.
 */
RuleBgGulbara.prototype.rollDice = function() {
  return Rule.prototype.rollDice.call(this);
};

/**
 * Reset state to initial position of pieces.
 */
RuleBgGulbara.prototype.resetState = function(state) {
  /**
   * Move pieces to correct initial positions for both players.
   * Values in state.points are zero based and denote the .
   * the number of pieces on each position.
   * Index 0 of array is position 1 and increments to the number of maximum
   * points.
   *
   * Position: |12 13 14 15 16 17| |18 19 20 21 22 23|
   *           |                 | |              15w| <-
   *           |                 | |                 |
   *           |                 | |                 |
   *           |                 | |                 |
   *        -> |15b              | |                 |
   * Position: |11 10 09 08 07 06| |05 04 03 02 01 00|
   *
   */

  model.State.clear(state);

  this.place(state, 15, model.PieceType.WHITE, 23);

  this.place(state, 15, model.PieceType.BLACK, 11);
};


module.exports = new RuleBgGulbara();
