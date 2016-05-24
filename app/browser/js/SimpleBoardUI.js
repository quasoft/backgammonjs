var $ = require('jquery');
var model = require('../../../lib/model.js');

/**
 * Contains graphical user interface and functionality for moving pieces
 * @constructor
 * @param client - Client object in control of this UI
 */
function SimpleBoardUI(client) {
  this.client = client;
  this.game = null;
  this.rule = null;

  this.MAX_VISIBLE_PIECES = 5;

  this.init = function () {
    this.container = $('#' + this.client.config.containerID);
    console.log(this.container);
    this.board = $('<div class="board cf"></div>');
    this.board.appendTo(this.container);

    this.createControls();
  };

  this.createControls = function () {
    var self = this;

    $('#btn-start').click(function (e) {
      self.client.reqStartGame(self.game.id);
    });

    $('#btn-roll').click(function (e) {
      self.client.reqRollDice(self.game.id);
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
    console.log("createPoints");
    this.board.append($('<div id="frame-top" class="frame">&nbsp;</div>'));
    this.board.append($('<div id="row1" class="row"></div>'));
    this.board.append($('<div id="row2" class="row"></div>'));
    this.board.append($('<div id="frame-bottom" class="frame">&nbsp;</div>'));
    this.row1 = $('#row1');
    this.row2 = $('#row2');

    for (var i = this.rule.maxPoints / 2; i < this.rule.maxPoints; i++) {
      var typeClass = i % 2 === 0 ? 'even' : 'odd';

      this.createPoint(this.row1, i, typeClass);
    }

    for (var k = this.rule.maxPoints / 2 - 1; k >= 0; k--) {
      var typeClass = k % 2 === 0 ? 'even' : 'odd';

      this.createPoint(this.row2, k, typeClass);
    }
  };

  this.createPiece = function (pos, piece, count) {
    var point = this.getPoint(pos);

    var pieceTypeClass = piece.type === model.PieceType.WHITE ? 'white' : 'black';

    //countText = (count > 0) ? '<span>' + count + '</span>' : '&nbsp';
    var countText = (piece.id) ? '<span>' + piece.id + '</span>' : '&nbsp';

    point.append($('<div id="piece' + piece.id + '" class="piece ' + pieceTypeClass + '"><div class="image">' + countText + '</div></div>'));
  };

  /**
   * Compact pieces in specific point to make them fit on screen vertically.
   * @param {Number} pos - Position of point
   */
  this.compactPieces = function (pos) {
    var point = this.game.state.points[pos];
    var pointElement = this.getPoint(pos);
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

        var alignment = this.getRow(pos) == 1 ? 'top' : 'bottom';

        pieceElement.css(alignment, "0");
        pieceElement.css("margin-" + alignment, this.toFixedDown(marginPercent, 2) + "%");
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
    this.board.empty();
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

    /*
    angular.module("root", [])
           .controller("board", ["$scope", function($scope) {
             $scope.showStart1 = this.game && this.game.host
                                          && this.client.player
                                          && (this.game.host.id == this.client.player.id);
             $scope.showStart = false;
           }]);
    */
    //this.createPieces(model.PieceType.WHITE);
    //this.createPieces(model.PieceType.BLACK);
    this.update();
  };

  this.update = function () {

    if (this.game == null) {
      $('#btn-start').hide();
      $('#btn-roll').hide();
      $('#btn-confirm').hide();
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

    $('#btn-confirm').toggle(
      this.game.hasStarted && (!this.game.isOver)
      &&
      model.Game.isPlayerTurn(this.game, this.client.player)
      &&
      model.Game.diceWasRolled(this.game)
      &&
      (!model.Game.hasMoreMoves(this.game))
      &&
      (!this.game.turnConfirmed)
    );

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

    // main states:
    // - is game created?
    // - has other player joined?
    // - is game started?
    // - is game over?
    // - is my turn?
    // - has dice been rolled?
    // - have more moves to make?
    // - have confirmed moves?
    // -
  };

  this.updateDie = function (dice, index) {
    var id = '#die' + index;
    $(id).html(dice.values[index]);
    $(id).addClass('digit-' + dice.values[index]);
  };

  this.updateDice = function (dice) {
    this.updateDie(dice, 0);
    this.updateDie(dice, 1);
  };
}

module.exports = SimpleBoardUI;
