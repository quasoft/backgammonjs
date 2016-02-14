var App = App || {};
(function(app) {
  app.config = {
    'containerID': 'backgammon',
    'rule': 'RuleBgCasual'
  };

  app.toFixedDown = function(number, digits) {
    if(number == 0) {
      return 0;
    }
    var n = number - Math.pow(10, -digits)/2;
    n += n / Math.pow(2, 53); // added 1360765523: 17.56.toFixedDown(2) === "17.56"
    return n.toFixed(digits);
  };

  /**
   * Contains graphical user interface and functionality for moving pieces
   * @constructor
   */
  app.GUI = function (state, rule) {
    this.state = state;
    this.rule = rule;

    this.MAX_VISIBLE_PIECES = 5;

    this.init = function () {
      this.container = $('#' + app.config.containerID);
      this.board = $('<div class="board cf"></div>');
      this.board.appendTo(this.container);

      this.createPoints();
      this.createPieces(this.state);

      //this.createPieces(Backgammon.PieceType.WHITE);
      //this.createPieces(Backgammon.PieceType.BLACK);
    };

    this.getPoint = function (pos) {
      return $('#point' + pos);
    };

    this.getRow = function (pos) {
      return (pos >= 12) ? 1 : 2;
    };

    this.getPieceByID = function (id) {
      return $('#piece' + id);
    };

    this.createPoint = function (row, pos, type) {
      row.append($('<div id="point' + pos + '" class="point ' + type + '"></div>'));
    };

    this.createPoints = function () {
      this.board.append($('<div id="frame-top" class="frame">&nbsp;</div>'));
      this.board.append($('<div id="row1" class="row"></div>'));
      this.board.append($('<div id="row2" class="row"></div>'));
      this.board.append($('<div id="frame-bottom" class="frame">&nbsp;</div>'));
      this.row1 = $('#row1');
      this.row2 = $('#row2');

      for (var i = this.rule.maxPoints / 2; i < this.rule.maxPoints; i++) {
        typeClass = i % 2 === 0 ? 'even' : 'odd';

        this.createPoint(this.row1, i, typeClass);
      }

      for (var i = this.rule.maxPoints / 2 - 1; i >= 0; i--) {
        typeClass = i % 2 === 0 ? 'even' : 'odd';

        this.createPoint(this.row2, i, typeClass);
      }
    };

    this.createPiece = function (pos, piece, count) {
      var point = this.getPoint(pos);

      pieceTypeClass = piece.type === Backgammon.PieceType.WHITE ? 'white' : 'black';

      //countText = (count > 0) ? '<span>' + count + '</span>' : '&nbsp';
      countText = (piece.id) ? '<span>' + piece.id + '</span>' : '&nbsp';

      point.append($('<div id="piece' + piece.id + '" class="piece ' + pieceTypeClass + '"><div class="image">' + countText + '</div></div>'));
    };

    /*
     * @param {Backgammon.Piece} piece
     * @param {int} offset - offset from bottom or top.
     */
    this.compactPieces = function (pos) {
      var point = this.state.getPoint(pos);
      var pointElement = this.getPoint(pos);
      var pointHeight = pointElement.height();

      if (point.getPieceCount() > 0) {
        var firstPieceElement = this.getPieceByID(point.pieces[0].id);
        var pieceHeight = (firstPieceElement) ? firstPieceElement.width() : 0;
        var ratio = 100;
        var overflow = (pieceHeight * point.getPieceCount()) - pointHeight;
        if (pos == 12) {
          console.log('pos: ' + pos);
          console.log('pointHeight: ' + pointHeight);
          console.log('getPieceCount: ' + point.getPieceCount());
          console.log('pieceHeight: ' + pieceHeight);
          console.log('overflow: ' + overflow);
        }
        if ((overflow > 0) && (pieceHeight > 0) && (point.getPieceCount() > 1))
        {
          // Example:
          // pieceHeight = 88
          // offset per piece = 8
          // margin in percent = 100 - ((8 / 88) * 100)
          ratio = 100 - (((overflow / (point.getPieceCount() - 1)) / pieceHeight) * 100);
        }
        if (pos == 12) {
          console.log('ratio: ' + ratio);
        }
        if (ratio > 100) {
          ratio = 100;
        }
        if (ratio <= 0) {
          ratio = 1;
        }
        if (pos == 12) {
          console.log('ratio: ' + ratio);
        }

        for (var i = 0; i < point.getPieceCount(); i++) {
          var piece = point.pieces[i];
          var pieceElement = this.getPieceByID(piece.id);
          if (pos == 12) {
            console.log('pieceID: ' + piece.id);
            console.log('ratio: ' + ratio);
          }
          var marginPercent = ratio * i;

          alignment = this.getRow(pos) == 1 ? 'top' : 'bottom';

          pieceElement.css(alignment, "0");
          pieceElement.css("margin-" + alignment, app.toFixedDown(marginPercent, 2) + "%");
        }
      }

      //var piece = this.getPiece(id);
/*
      piece.

      pieceTypeClass = piece.type === Backgammon.PieceType.WHITE ? 'white' : 'black';

      countText = (count > 0) ? '<span>' + count + '</span>' : '&nbsp';

      point.append($('<div id="piece' + piece.id + '" class="piece ' + pieceTypeClass + '"><div class="image">' + countText + '</div></div>'));
      */
    };

    this.createPieces = function () {
      for (var pos = 0; pos < this.state.getPointCount(); pos++) {
        var point = this.state.getPoint(pos);
        for (var i = 0; i < point.getPieceCount(); i++) {
          this.createPiece(pos, point.pieces[i], 0);
        }
        this.compactPieces(pos);
      }
    };
  };

  app.init = function () {
    this.state = new Backgammon['Board']();
    this.rule = new Backgammon[this.config.rule]();
    this.rule.initialize(this.state);
    this.rule.resetBoard(this.state);
    this.gui = new this.GUI(this.state, this.rule);
    this.gui.init();
  };

  return app;
})(App);
