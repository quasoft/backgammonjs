var Backgammon = Backgammon || {};
(function(bg) {

  /**
   * Current version supports only two colours of checkers and two players as
   * the author is not yet aware of rules with three or more types of checkers
   * and/or players.
   */
  bg.PieceType = {
    WHITE : 0,
    BLACK : 1
  };

  /**
   * Denotes direction of piece movement relative to initial position.
   * LEFT: from initial position to left (then to right on opposite side of board)
   * RIGHT: from initial position to right (then to left on opposite side of board)
   */
  bg.Direction = {
    LEFT : 0,
    RIGHT : 1
  };

  /**
   * Random generator.
   * @constructor
   */
   bg.Random = function () {
     ;
   };
   bg.Random.get = function(max) {
     max = max || 6;
     return Math.floor(Math.random() * max) + 1;
   };

  /**
   * Pieces are round checkers that are being moved around the board.
   * @constructor
   */
  bg.Piece = function(type, id) {
    this.type = type;
    this.id = id;
  };

  /**
   * Stack is a LIFO list of pieces.
   * @constructor
   */
  bg.Stack = function() {
    this.pieces = [];

    this.pop = function () {
      return this.pieces.pop();
    };

    this.push = function (piece) {
      return this.pieces.push(piece);
    };

    this.getPieceCount = function() {
      return this.pieces.length;
    };
  };

  /**
   * Bar is the place where pieces go when hit.
   * @constructor
   */
  bg.Bar = function () {
    bg.Stack.call(this);
  };
  bg.Bar.prototype = Object.create(bg.Stack.prototype);
  bg.Bar.prototype.constructor = bg.Bar;

  /**
   * Home is the place where pieces go when bearred off.
   * @constructor
   */
  bg.Home = function () {
    bg.Stack.call(this);
  };
  bg.Home.prototype = Object.create(bg.Stack.prototype);
  bg.Home.prototype.constructor = bg.Home;

  /**
   * Points are positions on board usually marked with triangles.
   * @constructor
   */
  bg.Point = function() {
    bg.Stack.call(this);

    this.number = 0;
  };
  bg.Point.prototype = Object.create(bg.Stack.prototype);
  bg.Point.prototype.constructor = bg.Point;

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
   * graphical movement of pieces itself.
   * @constructor
   */
  bg.Board = function() {
    /**
     * All popular variants of the game have a total of 24 positions on the board
     * and two positions outside - the place on the bar where pieces go when
     * hit and the place next to board where pieces go when beared off.
     * Number of positions is not strictly defined here to allow more options
     * when creating new rules.
     * The points, bar, home and pieces properties should be initialized by the
     * Rule object. Each element in those properties should contain a stack
     * (last in, first out).
     */
    this.points = [];

    /**
     * Players have separate bar and home places and so separate list.
     * First element of array is for white pieces and second one for black.
     */
    this.bar = [[],[]];
    this.whiteBar = this.bar[bg.PieceType.WHITE];
    this.blackBar = this.bar[bg.PieceType.BLACK];

    this.home = [[],[]];
    this.whiteHome = this.home[bg.PieceType.WHITE];
    this.blackHome = this.home[bg.PieceType.BLACK];

    /**
     * A two dimensional array is also used to store references to all white and
     * black pieces independent of their position - just for convenience.
     */
    this.pieces = [[],[]];
    this.whitePieces = this.pieces[bg.PieceType.WHITE];
    this.blackPieces = this.pieces[bg.PieceType.BLACK];

    this.nextPieceID = 1;

    /**
     * Get point by its number
     */
    this.getPoint = function (number) {
      return this.points[number];
    };

    this.getPointCount = function() {
      return this.points.length;
    };

    /**
     * Remove pieces from board.
     */
    this.clear = function () {
      this.nextPieceID = 1;
      for (var i = 0; i < this.points.length; i++) {
        this.points[i].length = 0;
      }
      this.whiteBar.length = 0;
      this.blackBar.length = 0;
      this.whiteHome.length = 0;
      this.blackHome.length = 0;
      this.whitePieces.length = 0;
      this.blackPieces.length = 0;
    };

    /**
     * Move piece without enforcing any rules.
     */
    this.move = function (fromPoint, toPoint) {
      var piece = this.getPoint(fromPoint).pop();
      if (piece != null) {
        this.getPoint(fromPoint).push(piece);
        return true;
      }

      return false;
    };

    /**
     * Place one or more pieces from player set to board point.
     */
    this.place = function (number, type, position) {
      for (var i = 0; i < number; i++) {
        var piece = new bg.Piece(type, this.nextPieceID);
        this.pieces[type].push(piece);
        this.getPoint(position).push(piece);
        this.nextPieceID++;
      }

      return true;
    };

    /**
     * Bear piece from board to home
     */
    this.bear = function (position, type) {
      var piece = this.getPoint(position).pop();
      if (piece != null) {
        if (piece.PieceType === type) {
          this.home[type].push(piece);
          return true;
        }

        this.getPoint(position).push(piece);
      }

      return false;
    };

    /**
     * Hit piece = send piece to bar
     */
    this.hit = function (position, type) {
      var piece = this.getPoint(position).pop();
      if (piece != null) {
        if (piece.PieceType === type) {
          this.bar[type].push(piece);
          return true;
        }

        this.getPoint(position).push(piece);
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
