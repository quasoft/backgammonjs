var Backgammon = Backgammon || {};
(function(bg) {

  /**
   * One of the less popular variants of backgammon in Bulgaria (гюлбара).
   */
  bg.RuleBgGulbara = function() {
    bg.Rule.call(this);

    this.title = "Gul bara";
    this.description = "One of the less popular variants of backgammon in Bulgaria.";
    this.country = "Bulgaria";
    this.countryCode = "bg";
  };

  bg.RuleBgGulbara.prototype = Object.create(bg.Rule.prototype);
  bg.RuleBgGulbara.prototype.constructor = bg.RuleBgGulbara;

  /**
   * Roll dice and generate list of moves the player has to make according to
   * current rules.
   */
  bg.RuleBgGulbara.prototype.rollDice = function() {
    return bg.Rule.prototype.rollDice.call(this);
  };

  /**
   * Reset board to initial position of pieces.
   */
  bg.RuleBgGulbara.prototype.resetBoard = function(board) {
    /**
     * Move pieces to correct initial positions for both players.
     * Values in board.points are zero based and denote the .
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

    board.clear();

    board.place(15, bg.PieceType.WHITE, 23);

    board.place(15, bg.PieceType.BLACK, 11);
  };

  return bg;
}(Backgammon))
