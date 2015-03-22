var Backgammon = Backgammon || {};
(function(bg) {

  /**
   * Current version supports only two colours of checkers and two players as
   * the author is not yet aware of rules with three or more types of checkers
   * and/or players.
   */
  bg.PieceType = {
    WHITE = 0,
    BLACK = 1
  };

  /**
   * Random generator.
   * @constructor
   */
   bg.Random = function () {

   };
   bg.Random.get = function(max = 6) {
     return Math.floor(Math.random() * max) + 1;
   };

  /**
   * Pieces are round checkers that are being moved around the board.
   * @constructor
   */
  bg.Piece = function() {
    this.Type = bg.PieceType.WHITE;
  };

  /**
   * Points are positions on board usually marked with triangles.
   * @constructor
   */
  bg.Point = function() {
    this.Number = 0;
  };

  /**
   * Dice with basic functionality to roll using good random generator.
   * Not extensible for now and supports only dices/values.
   * @constructor
   */
  bg.Dice = function() {
    this.values = [0, 0];
    this.moves = [];
  };

  bg.Dice.roll = function() {
    var dice = new Dice ();
    dice.values[0] = bg.Random.get();
    dice.values[1] = bg.Random.get();
    return dice;
  };

  /**
   * Board contains points and pieces and very basic methods to move pieces
   * around without enforcing any rules. Those methods are responsible for
   * required changes to internal state only, the UI layer should handle
   * graphical movement of piecies itself.
   * @constructor
   */
  bg.Board = function() {
    /**
     * Popular variants of the game have a total of 24 positions on the board
     * and two positions outside - the place on the bar where piecies go when
     * hit (position #0 in mose rules) and the place next to board where piecies go
     * when beared off (position #25).
     * Number of positions is not strictly defined here to allow more options
     * when creating new rules.
     * The points property should be initialized by the Rule object. Each point
     * should contain a stack (last in, first out) of pieces.
     */
    this.points = [];

    /**
     * A two dimensional array is used to store references to white and black
     * pieces separately. First element of array for white pieces and second
     * one for black.
     */
    this.pieces = [[],[]];

    this.getPoint = function (number) {
      return points;
    };

    this.move = function (fromPoint, toPoint) {
      var piece = getPoint(fromPoint).pop();
      if (piece != null) {
        getPoint(fromPoint).push(piece);
        return true;
      }

      return false;
    };
  };

  /**
   * Player
   * @constructor
   */
  bg.Player = function() {
    this.name = 0;
  };

  return bg;
}(Backgammon))
