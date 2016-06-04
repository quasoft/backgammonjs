var $ = require('jquery');
var model = require('../../../lib/model.js');

/**
 * Contains graphical user interface and functionality for moving pieces
 * @constructor
 * @param client - Client object in control of this UI
 */
function SimpleBoardUI(client) {
  /**
   * @type {Client}
   */
  this.client = client;

  /**
   * @type {Game}
   */
  this.game = null;

  /**
   * @type {Rule}
   */
  this.rule = null;

  this.MAX_VISIBLE_PIECES = 5;

  this.init = function () {
    this.container = $('#' + this.client.config.containerID);
    this.container.append($('#tmpl-board').html());
    
    this.board = $('#board');
    this.fields = [];
    for (var i = 0; i < 4; i++) {
      this.fields[i] = $('#field' + i);
    }

    var self = this;

    $('#btn-start').click(function (e) {
      self.client.reqStartGame();
    });

    $('#btn-roll').click(function (e) {
      self.client.reqRollDice();
    });

    $('#btn-confirm').click(function (e) {
      self.client.reqConfirmMoves();
    });
  };

  /**
   * Rounds down floating point value to specified number of digits
   * after decimal point
   * @param {Number} number - float number to round
   * @param {Number} digits - number of digits after decimal point
   * @returns {Number} rounded number as float
   */
  this.toFixedDown = function(number, digits) {
    if(number == 0) {
      return 0;
    }
    var n = number - Math.pow(10, -digits)/2;
    n += n / Math.pow(2, 53); // added 1360765523: 17.56.toFixedDown(2) === "17.56"
    return n.toFixed(digits);
  };

  this.getPointElem = function (pos) {
    return $('#point' + pos);
  };

  this.getTopPieceElem = function (pos) {
    var pointElem = $('#point' + pos);
    var pieceElem = pointElem.find('div.piece').last();
    return pieceElem;
  };

  this.getTopPiece = function (pos) {
    var pieceElem = this.getTopPieceElem(pos);
    return pieceElem.data('piece');
  };

  this.getBarPieceElem = function () {

  };

  this.getPieceByID = function (id) {
    return $('#piece' + id);
  };

  this.createPoint = function (field, pos, type) {
    var pointElem = $('<div id="point' + pos + '" class="point ' + type + '"></div>');
    pointElem.data('position', pos);
    field.append(pointElem);

    /*
    var self = this;
    pointElem.click({ 'pos': pos }, function (e) {
      window.alert("clicked point " + e.data.pos);
      //self.client.reqStartGame(self.game.id);
    });
    */
    var self = this;
    pointElem.click(function (e) {
      if (!model.Game.hasMoreMoves(self.game)) {
        return;
      }

      var func = null;
      // If right mouse button was pressed, play lowest die value
      if (e.which == 3) {
        func = Math.min;
      }
      // If left mouse button was pressed, play highest die value
      else {
        func = Math.max;
      }
      var steps = func.apply(Math, self.game.turnDice.movesLeft);
      console.log($(this));
      var position = $(this).data('position');
      console.log(position);
      //var piece = self.getTopPiece(position);
      self.client.reqMove(position, null, steps);
    });
  };

  this.createPoints = function () {
    for (var i = 12; i < 18; i++) {
      var typeClass = i % 2 === 0 ? 'even' : 'odd';
      this.createPoint(this.fields[0], i, typeClass);
    }
    
    for (var i = 11; i >= 6; i--) {
      var typeClass = i % 2 === 0 ? 'even' : 'odd';
      this.createPoint(this.fields[1], i, typeClass);
    }
    
    for (var i = 18; i < 24; i++) {
      var typeClass = i % 2 === 0 ? 'even' : 'odd';
      this.createPoint(this.fields[2], i, typeClass);
    }

    for (var i = 5; i >= 0; i--) {
      var typeClass = i % 2 === 0 ? 'even' : 'odd';
      this.createPoint(this.fields[3], i, typeClass);
    }
  };

  this.createPiece = function (pos, piece, count) {
    var pieceTypeClass = piece.type === model.PieceType.WHITE ? 'white' : 'black';

    //countText = (count > 0) ? '<span>' + count + '</span>' : '&nbsp';
    var countText = (piece.id) ? '<span>' + piece.id + '</span>' : '&nbsp';

    var pieceElem = $('<div id="piece' + piece.id + '" class="piece ' + pieceTypeClass + '"><div class="image">' + countText + '</div></div>');
    pieceElem.data('piece', piece);

    var pointElem = this.getPointElem(pos);
    pointElem.append(pieceElem);

    /*
    var self = this;
    pieceElem.click(function (e) {
      if (!model.Game.hasMoreMoves(self.game)) {
        return;
      }

      var func = null;
      // If right mouse button was pressed, play lowest die value
      if (e.which == 3) {
        func = Math.min;
      }
      // If left mouse button was pressed, play highest die value
      else {
        func = Math.max;
      }
      var steps = func.apply(Math, self.game.turnDice.movesLeft);
      var position = $(this).parent().data('position');
      var piece = $(this).data('piece');
      self.client.reqMove(position, piece.type, steps);
    });
*/
  };

  /**
   * Compact pieces in specific point to make them fit on screen vertically.
   * @param {Number} pos - Position of point
   */
  this.compactPieces = function (pos) {
    var point = this.game.state.points[pos];
    var pointElement = this.getPointElem(pos);
    var pointHeight = pointElement.height();

    if (point.length > 0) {
      var firstPieceElement = this.getPieceByID(point[0].id);
      var pieceHeight = (firstPieceElement) ? firstPieceElement.width() : 0;
      var ratio = 100;
      var overflow = (pieceHeight * point.length) - pointHeight;
      if (pos == 12) {
        console.log('pos: ' + pos);
        console.log('pointHeight: ' + pointHeight);
        console.log('getPieceCount: ' + point.length);
        console.log('pieceHeight: ' + pieceHeight);
        console.log('overflow: ' + overflow);
      }
      if ((overflow > 0) && (pieceHeight > 0) && (point.length > 1))
      {
        // Example:
        // pieceHeight = 88
        // offset per piece = 8
        // margin in percent = 100 - ((8 / 88) * 100)
        ratio = 100 - (((overflow / (point.length - 1)) / pieceHeight) * 100);
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

      for (var i = 0; i < point.length; i++) {
        var piece = point[i];
        var pieceElement = this.getPieceByID(piece.id);
        if (pos == 12) {
          console.log('pieceID: ' + piece.id);
          console.log('ratio: ' + ratio);
        }
        var marginPercent = ratio * i;

        var alignment = ((pos >= 12) && (pos <= 23)) ? 'top' : 'bottom';
        var negAlignment = ((pos >= 12) && (pos <= 23)) ? 'bottom' : 'top';
        
        console.log(pos, alignment, negAlignment);

        pieceElement.css(alignment, "0");
        pieceElement.css("margin-" + alignment, this.toFixedDown(marginPercent, 2) + "%");

        pieceElement.css(negAlignment, "inherit");
        pieceElement.css("margin-" + negAlignment, "inherit");
      }
    }

    //var piece = this.getPiece(id);
/*
    piece.

    pieceTypeClass = piece.type === model.PieceType.WHITE ? 'white' : 'black';

    countText = (count > 0) ? '<span>' + count + '</span>' : '&nbsp';

    point.append($('<div id="piece' + piece.id + '" class="piece ' + pieceTypeClass + '"><div class="image">' + countText + '</div></div>'));
    */
  };

  this.createPieces = function () {
    for (var pos = 0; pos < this.game.state.points.length; pos++) {
      var point = this.game.state.points[pos];
      for (var i = 0; i < point.length; i++) {
        this.createPiece(pos, point[i], 0);
      }
      this.compactPieces(pos);
    }
  };

  this.removePoints = function () {
    for (var i = 0; i < 4; i++) {
      this.fields[i].empty();
    }
  };

  this.removePieces = function () {
    for (var pos = 0; pos < this.game.state.points.length; pos++) {
      var point = this.game.state.points[pos];
      var pointElem = this.getPointElem(pos);
      pointElem.empty();
    }
  };

  /**
   * Reset board UI
   * @param {Game} game - Game
   * @param {Rule} rule - Rule
   */
  this.resetBoard = function (game, rule) {
    this.game = game;
    this.rule = rule;

    this.removePoints();

    this.createPoints();
    this.createPieces();

    this.updateControls();
  };

  /**
   * Update board
   * @param {Game} game - Game
   */
  this.updateBoard = function (game) {
    this.game = game;

    this.removePieces();
    this.createPieces();
    this.updateControls();
  };

  this.updateControls = function () {

    if (this.game == null) {
      $('#btn-start').hide();
      $('#btn-roll').hide();
      $('#btn-confirm').hide();
      $('#btn-undo').hide();
      return;
    }

    $('#btn-start').toggle(
      model.Game.isHost(this.game, this.client.player)
      &&
      (!this.game.hasStarted)
    );

    $('#btn-roll').toggle(
      this.game.hasStarted && (!this.game.isOver)
      &&
      model.Game.isPlayerTurn(this.game, this.client.player)
      &&
      (!model.Game.diceWasRolled(this.game))
      &&
      (!this.game.turnConfirmed)
    );

    var canConfirmMove =
      this.game.hasStarted && (!this.game.isOver)
      &&
      model.Game.isPlayerTurn(this.game, this.client.player)
      &&
      model.Game.diceWasRolled(this.game)
      &&
      (!model.Game.hasMoreMoves(this.game))
      &&
      (!this.game.turnConfirmed);
    $('#btn-confirm').toggle(canConfirmMove);
    $('#btn-undo').toggle(canConfirmMove);

    var showDice = this.game.hasStarted
      &&
      (!this.game.isOver)
      &&
      model.Game.diceWasRolled(this.game)
      &&
      (!this.game.turnConfirmed);
    $('#dice').toggle(showDice);

    if (showDice) {
      this.updateDice(this.game.turnDice);
    }

    console.log('Board UI updated');
    console.log(this.game);
    console.log(this.client.player);
  };

  this.updateDie = function (dice, index) {
    var id = '#die' + index;
    $(id).html(dice.values[index]);
    $(id).removeClass('digit-1 digit-2 digit-3 digit-4 digit-5 digit-6');
    $(id).addClass('digit-' + dice.values[index]);
  };

  this.updateDice = function (dice) {
    this.updateDie(dice, 0);
    this.updateDie(dice, 1);
  };

  this.playActions = function (actionList) {
    for (var i = 0; i < actionList.length; i++) {
      var action = actionList[i];

      if (action.type === model.MoveActionType.MOVE) {
        var piece = this.getTopPiece(action.from);
        if (piece.type !== action.pieceType) {
          throw new Error('Wrong piece type!');
        }

        var pieceElem = this.getTopPieceElem(action.from);
        var srcPointElem = pieceElem.parent();
        var dstPointElem = this.getPointElem(action.to);

        pieceElem.detach();
        dstPointElem.append(pieceElem);

        this.compactPieces(srcPointElem.data('position'));
        this.compactPieces(dstPointElem.data('position'));
      }
      else if (action.type === model.MoveActionType.RECOVER) {
        var pieceElem = this.getBarPieceElem(action.pieceType);
        var piece = pieceElem.data('piece');
        var srcPointElem = pieceElem.parent();
        var dstPointElem = this.getPointElem(action.position);

        pieceElem.detach();
        dstPointElem.append(pieceElem);

        this.compactPieces(dstPointElem.data('position'));
      }
      else if (action.type === model.MoveActionType.HIT) {
        var piece = this.getTopPiece(action.position);
        if (piece.type !== action.pieceType) {
          throw new Error('Wrong piece type!');
        }

        var pieceElem = this.getTopPieceElem(action.from);
        var srcPointElem = pieceElem.parent();

        pieceElem.detach();

        this.compactPieces(srcPointElem.data('position'));
      }
      else if (action.type === model.MoveActionType.BEAR) {
        var piece = this.getTopPiece(action.position);
        if (piece.type !== action.pieceType) {
          throw new Error('Wrong piece type!');
        }

        var pieceElem = this.getTopPieceElem(action.from);
        var srcPointElem = pieceElem.parent();

        pieceElem.detach();

        this.compactPieces(srcPointElem.data('position'));
      }

      // TODO: Make sure actions are played back slow enough for player to see
      // all of them comfortly
    }
  }
}

module.exports = SimpleBoardUI;
