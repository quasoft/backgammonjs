var Backgammon = Backgammon || {};
(function(bg) {

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
  bg.Rule = function() {
    if (this.constructor === bg.Rule) {
      throw new Error("Can't instantiate abstract class!");
    }

    this.Title = "";
    this.Description = "";
    this.Country = "";

    this.MaxPoints = 0;
    this.MaxPieces = 0;
  };

  /**
   * Roll dice and generate list of moves the player has to make according to
   * current rules.
   * @abstract
   */
  bg.Rule.prototype.rollDice = function() {
    throw new Error("Abstract method!");
  };

  /**
   * Reset board to initial position of pieces.
   * @abstract
   */
  bg.Rule.prototype.resetBoard = function(board) {
    throw new Error("Abstract method!");
  };

  return bg;
}(Backgammon))
