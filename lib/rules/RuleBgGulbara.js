var model = require('../model.js');
var Rule = require('./rule.js');

/**
 * One of the less popular variants of backgammon in Bulgaria (гюлбара).
 * @constructor
 * @extends Rule
 */
function RuleBgGulbara() {
  Rule.call(this);

  /**
   * Rule name, matching the class name (eg. 'RuleBgCasual')
   * @type {string}
   */
  this.name = "RuleBgGulbara";

  /**
   * Short title describing rule specifics
   * @type {string}
   */
  this.title = "Gul bara";

  /**
   * Full description of rule
   * @type {string}
   */
  this.description = "One of the less popular variants of backgammon in Bulgaria.";

  /**
   * Full name of country where this rule (variant) is played.
   * To list multiple countries use a pipe ('|') character as separator.
   * @type {string}
   */
  this.country = "Bulgaria";

  /**
   * Two character ISO code of country where this rule (variant) is played.
   * To list multiple codes use a pipe ('|') character as separator.
   * List codes in same order as countries in the field above.
   * @type {string}
   */
  this.countryCode = "bg";
}

RuleBgGulbara.prototype = Object.create(Rule.prototype);
RuleBgGulbara.prototype.constructor = RuleBgGulbara;

/**
 * Roll dice and generate list of moves the player has to make according to
 * current rules.
 *
 * In this variant of the game moves for doubles are determined in the following way:
 * - In first three dice rolls (counted separately for each player) doubles are played
 *   as four moves - eg. 5:5 is played as [5,5,5,5].
 * - In all dice rolls after that, all doubles with values higher than the rolled one are played sequentially.
 *   For example 4:4 dice is played as [4,4,4,4], then [5,5,5,5] and finally [6,6,6,6],
 *   whereas 5:5 dice is played as [5,5,5,5] and [6,6,6,6].
 * - If the player cannot play all moves, but has moved at least one piece, then the other player
 *   finishes the moves that could not be played and then rolls the dice (as it is his turn).
 *
 * @returns {Dice} - Dice object containing random values and allowed moves
 */
RuleBgGulbara.prototype.rollDice = function() {
  return Rule.prototype.rollDice.call(this);
};

/**
 * Reset state to initial position of pieces according to current rule.
 * @param {State} state - Board state
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
