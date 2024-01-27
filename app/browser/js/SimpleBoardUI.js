'use strict';
/*jslint browser: true */
/*global fitText: false */
/*global ohSnap: false */

var $ = require('jquery');
var model = require('../../../lib/model.js');
require('../bower_components/oh-snap/ohsnap.js');
var BootstrapDialog = require('../bower_components/bootstrap3-dialog/dist/js/bootstrap-dialog.min.js');

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
   * @type {Match}
   */
  this.match = null;

  /**
   * @type {Rule}
   */
  this.rule = null;

  this.init = function () {
    this.container = $('#' + this.client.config.containerID);
    this.container.append($('#tmpl-board').html());
    this.container.append($('<div id="ohsnap"></div>'));
    this.displayPieceId = true;

    this.board = $('#board');
    this.fields = [];
    for (var i = 0; i < 4; i++) {
      this.fields[i] = $('#field' + i);
    }

    this.assignActions();
  };

  /**
   * Rounds down floating point value to specified number of digits
   * after decimal point
   * @param {Number} number - float number to round
   * @param {Number} digits - number of digits after decimal point
   * @returns {Number} rounded number as float
   */
  this.toFixedDown = function(number, digits) {
    if(number === 0) {
      return 0;
    }
    var n = number - Math.pow(10, -digits)/2;
    n += n / Math.pow(2, 53); // added 1360765523: 17.56.toFixedDown(2) === "17.56"
    return n.toFixed(digits);
  };

  this.notifyOhSnap = function (message, params) {
    if (!params.duration) {
      params.duration = 1500;
    }
    ohSnap(message, params);
  };

  this.notifyInfo = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'blue', duration: timeout});
  };

  this.notifyPositive = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'green', duration: timeout});
  };

  this.notifyNegative = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'red', duration: timeout});
  };

  this.notifySuccess = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'green', duration: timeout});
  };

  this.notifyError = function (message, timeout) {
    this.notifyOhSnap(message, {color: 'red', duration: timeout});
  };

  this.getPointElem = function (pos) {
    return $('#point' + pos);
  };

  this.getPieceElem = function (piece) {
    return $('#piece' + piece.id);
  };

  this.getTopPieceElem = function (pos) {
    var pointElem = $('#point' + pos);
    if (pointElem) {
      return pointElem.find('div.piece').last();
    }
    return null;
  };

  this.getTopPiece = function (pos) {
    var pieceElem = this.getTopPieceElem(pos);
    if (pieceElem) {
      return pieceElem.data('piece');
    }
    return null;
  };

  this.getBarElem = function (type) {
    var barID = (type === this.client.player.currentPieceType) ? 'top-bar' : 'bottom-bar';
    var bar = $('#' + barID);
    return bar;
  };

  this.getBarTopPieceElem = function (type) {
    var barElem = this.getBarElem(type);
    var pieceElem = barElem.find('div.piece').last();

    return pieceElem;
  };

  this.getBarTopPiece = function (type) {
    var pieceElem = this.getBarTopPieceElem(type);
    if (pieceElem) {
      return pieceElem.data('piece');
    }
    return null;
  };

  this.getPieceByID = function (id) {
    return $('#piece' + id);
  };

  /**
   * Handles clicking on a point (position)
   * Add [SHIFT] to move UP
   */
  this.handlePointClick = function (e) {
    var self = e.data;
    var game = self.match.currentGame;

    console.log('mousedown click', game);
    if (!model.Game.hasMoreMoves(game)) {
      return;
    }

    var movesLeft = game.turnDice.movesLeft;
    var steps;
    // If right mouse button was pressed, play last die value
    if (e.which === 3) {
      steps = movesLeft[movesLeft.length - 1];
    }
    // If left mouse button was pressed, play first die value
    else {
      steps = movesLeft[0];
    }
    var position = $(e.currentTarget).data('position');
    var piece = self.getTopPiece(position);
    if (piece) {
      // If shift key was pressed, move UP by height=steps
      if (e.shiftKey === true) {
        self.client.reqUp(piece, steps);
      } else {
        self.client.reqMove(piece, steps);
      }
    }
    e.preventDefault();
  };

  /**
   * Handles clicking on bar
   */
  this.handleBarClick = function (e) {
    var self = e.data;
    var game = self.match.currentGame;

    if (!model.Game.hasMoreMoves(game)) {
      return;
    }

    var movesLeft = game.turnDice.movesLeft;
    var steps;
    // If right mouse button was pressed, play last die value
    if (e.which === 3) {
      steps = movesLeft[movesLeft.length - 1];
    }
    // If left mouse button was pressed, play first die value
    else {
      steps = movesLeft[0];
    }
    var pieceElem = $(e.currentTarget).find('div.piece').last();
    var piece = pieceElem.data('piece');
    if (piece) {
      self.client.reqMove(piece, steps);
    }
    e.preventDefault();
  };

  /**
   * Assign actions to DOM elements
   */
  this.assignActions = function () {
    var self = this;

    // Game actions
    $('#btn-roll').unbind('click');
    $('#btn-roll').click(function (e) {
      self.client.reqRollDice();
      console.log('roll1', e);
      console.log('roll2', this);
    });

    $('#btn-confirm').unbind('click');
    $('#btn-confirm').click(function (e) {
      self.client.reqConfirmMoves();
    });

    $('#btn-undo').unbind('click');
    $('#btn-undo').click(function (e) {
      self.client.reqUndoMoves();
    });

    $('#menu-undo').unbind('click');
    $('#menu-undo').click(function (e) {
      $('.navbar').collapse('hide');
      self.client.reqUndoMoves();
    });

    $('#menu-resign').unbind('click');
    $('#menu-resign').click(function (e) {
      // Ask player if they want to resign from current game only
      // or abandon the whole match
      $('.navbar').collapse('hide');

      BootstrapDialog.show({
          title: 'Resign from game or match?',
          type: BootstrapDialog.TYPE_DEFAULT,
          closable: true,
          cssClass: 'resign-dialog',
          buttons: [
            {
              label: 'Game',
              icon: 'glyphicon glyphicon-flag',
              cssClass: 'btn-warning',
              action: function(dialog) {
                self.client.reqResignGame();
                dialog.close();
              }
            },
            {
              label: 'Match',
              icon: 'glyphicon glyphicon-remove-sign',
              cssClass: 'btn-danger',
              action: function(dialog) {
                self.client.reqResignMatch();
                dialog.close();
              }
            },
            {
              label: 'Cancel',
              action: function(dialog) {
                dialog.close();
              }
            }
          ]
      });
    });

    if ((!this.match) || (!this.match.currentGame) || (!this.client.player)) {
      return;
    }

    // Actions for points
    for (var pos = 0; pos < 24; pos++) {
      var pointElem = this.getPointElem(pos);

      $(document).on('contextmenu', pointElem, function(e){
        // Block browser menu
        // return false;
      });
      pointElem.unbind('mousedown');
      pointElem.mousedown(self, self.handlePointClick);
    }

    // Actions for bar
    for (var pieceType = 0; pieceType <= model.PieceType.BLACK; pieceType++) {
      console.log('pieceType', pieceType);
      var barElem = this.getBarElem(pieceType);
      console.log(barElem);

      $(document).on('contextmenu', barElem, function(e){
        // Block browser menu
        // return false;
      });

      barElem.unbind('mousedown');
      barElem.mousedown(self, self.handleBarClick);
    }
  };

  this.createPoint = function (field, pos, type) {
    var pointElem = $('<div id="point' + pos + '" class="point ' + type + '"></div>');
    pointElem.data('position', pos);
    field.append(pointElem);
  };

  this.createPoints = function () {
    /*
      Fields are numbered in the following way,
      no matter what pieces the user is playing with:
      - Field 0 - top left
      - Field 1 - bottom left
      - Field 2 - top right
      - Field 3 - bottom right

      Fields are arrange on the board in the following way:

      +12-13-14-15-16-17------18-19-20-21-22-23-+
      |                  |   |                  |
      |      Field 0     |   |      Field 2     |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |                  |   |                  |
      |      Field 1     |   |      Field 3     |
      |                  |   |                  |
      +11-10--9--8--7--6-------5--4--3--2--1--0-+ -1

    */

    var pieceType = this.client.player.currentPieceType;
    var i;
    var k;
    var typeClass;

    for (i = 12; i < 18; i++) {
      typeClass = i % 2 === 0 ? 'even' : 'odd';

      k = (pieceType === model.PieceType.BLACK) ? i - 12 : i;
      this.createPoint(this.fields[0], k, typeClass);
    }

    for (i = 11; i >= 6; i--) {
      typeClass = i % 2 === 0 ? 'even' : 'odd';

      k = (pieceType === model.PieceType.BLACK) ? i + 12 : i;
      this.createPoint(this.fields[1], k, typeClass);
    }

    for (i = 18; i < 24; i++) {
      typeClass = i % 2 === 0 ? 'even' : 'odd';

      k = (pieceType === model.PieceType.BLACK) ? i - 12 : i;
      this.createPoint(this.fields[2], k, typeClass);
    }

    for (i = 5; i >= 0; i--) {
      typeClass = i % 2 === 0 ? 'even' : 'odd';

      k = (pieceType === model.PieceType.BLACK) ? i + 12 : i;
      this.createPoint(this.fields[3], k, typeClass);
    }
  };

  this.createPiece = function (parentElem, piece, count) {
    var pieceTypeClass = piece.type === model.PieceType.WHITE ? 'white' : 'black';

    var pieceElem = $(
        '<div id="piece' +
            piece.id +
            '" class="piece ' +
            pieceTypeClass +
            '"><div class="image">' +
            (this.displayPieceId ? piece.id : "&nbsp;") +
            "</div></div>"
    );
    pieceElem.data('piece', piece);

    parentElem.append(pieceElem);
  };

  /**
   * Compact pieces in all positions
   */
  this.compactAllPositions = function () {
    for (var i = 0; i < 24; i++) {
      this.compactPosition(i);
    }
    this.compactElement(this.getBarElem(model.PieceType.WHITE), this.client.player.currentPieceType === model.PieceType.WHITE ? 'top' : 'bottom');
    this.compactElement(this.getBarElem(model.PieceType.BLACK), this.client.player.currentPieceType === model.PieceType.BLACK ? 'top' : 'bottom');
  };

  /**
   * Compact pieces in specific DOM element to make them fit vertically.
   * @param {number} pos - Position of point
   * @param {string} alignment - Alignment of pieces - 'top' or 'bottom', depending on within which side of the board the piece is
   */
  this.compactElement = function (element, alignment) {
    var elementHeight = element.height();
    var itemCount = element.children().length;

    if (itemCount > 0) {
      var firstItem = element.children().first();
      var itemHeight = firstItem.width();
      var ratio = 100;
      var overflow = (itemHeight * itemCount) - elementHeight;

      if ((overflow > 0) && (itemHeight > 0) && (itemCount > 1))
      {
        // Example:
        // itemHeight = 88
        // offset per item = 8
        // margin in percent = 100 - ((8 / 88) * 100)
        ratio = 100 - (((overflow / (itemCount - 1)) / itemHeight) * 100);
      }

      if (ratio > 100) {
        ratio = 100;
      }
      if (ratio <= 0) {
        ratio = 1;
      }

      var self = this;
      element.children().each(function(i) {
        var marginPercent = ratio * i;
        var negAlignment = (alignment === 'top') ? 'bottom' : 'top';

        // push up last piece if height override is set
        if (i === itemCount - 1) {
          const height = $(this).data('height');
          if (height) {
            marginPercent = ratio * (i + height);
          }
          // $(this).removeData('height');
        }
        $(this).css(alignment, "0");
        $(this).css("margin-" + alignment, self.toFixedDown(marginPercent, 2) + "%");

        $(this).css(negAlignment, "inherit");
        $(this).css("margin-" + negAlignment, "inherit");
      });
    }
  };

  /**
   * Compact pieces in specific position to make them fit on screen vertically.
   * @param {Number} pos - Position of point
   */
  this.compactPosition = function (pos) {
    var pointElement = this.getPointElem(pos);
    var alignment;

    if (this.client.player.currentPieceType === model.PieceType.BLACK) {
      alignment = ((pos >= 0) && (pos <= 11)) ? 'top' : 'bottom';
    }
    else {
      alignment = ((pos >= 12) && (pos <= 23)) ? 'top' : 'bottom';
    }

    this.compactElement(pointElement, alignment);
  };

  this.createPieces = function () {
    var game = this.match.currentGame;
    var i, pos;
    var b;

    for (pos = 0; pos < game.state.points.length; pos++) {
      var point = game.state.points[pos];
      for (i = 0; i < point.length; i++) {
        var pointElem = this.getPointElem(pos);
        this.createPiece(pointElem, point[i], 0);
      }
      this.compactPosition(pos);
    }


    for (b = 0; b < game.state.bar.length; b++) {
      var bar = game.state.bar[b];
      for (i = 0; i < bar.length; i++) {
        var piece = bar[i];
        var barElem = this.getBarElem(piece.type);
        this.createPiece(barElem, piece, 0);
      }
    }
  };

  this.removePoints = function () {
    for (var i = 0; i < 4; i++) {
      this.fields[i].empty();
    }
  };

  this.removePieces = function () {
    var game = this.match.currentGame;

    for (var pos = 0; pos < game.state.points.length; pos++) {
      var point = game.state.points[pos];
      var pointElem = this.getPointElem(pos);
      pointElem.empty();
    }

    this.getBarElem(model.PieceType.BLACK).empty();
    this.getBarElem(model.PieceType.WHITE).empty();
  };

  /**
   * Reset board UI
   * @param {Match} match - Match
   * @param {Rule} rule - Rule
   */
  this.resetBoard = function (match, rule) {
    this.match = match;
    this.rule = rule;

    this.removePieces();
    this.removePoints();

    this.createPoints();
    this.createPieces();

    this.randomizeDiceRotation();

    this.assignActions();
    this.updateControls();
    this.updateScoreboard();

    this.compactAllPositions();
  };

  this.handleTurnStart = function () {
    this.randomizeDiceRotation();
  };

  this.handleEventUndoMoves = function () {
    this.notifyInfo('Player undid last move.');
  };

  this.handleEventGameRestart = function () {
    var yourscore = this.match.score[this.client.player.currentPieceType];
    var oppscore = this.match.score[this.client.otherPlayer.currentPieceType];
    var message = 'Match result: <b>You ' + yourscore + '</b> / ' + oppscore + ' Opponent';
    var timeout = 5000;
    if (yourscore > oppscore) {
      this.notifyPositive(message, timeout);
    }
    else if (yourscore < oppscore) {
      this.notifyNegative(message, timeout);
    }
    else {
      this.notifyInfo(message, timeout);
    }
  };

  this.randomizeDiceRotation = function () {
    this.rotationAngle = [];
    for (var i = 0; i < 10; i++) {
      this.rotationAngle[i] = Math.random() * 30 - 15;
    }
  };

  this.updateControls = function () {

    if ((!this.match) || (!this.match.currentGame)) {
      $('#btn-roll').hide();
      $('#btn-confirm').hide();
      $('#btn-undo').hide();
      $('#menu-resign').hide();
      $('#menu-undo').hide();
      return;
    }

    var game = this.match.currentGame;

    $('#btn-roll').toggle(
      game.hasStarted &&
      (!game.isOver) &&
      model.Game.isPlayerTurn(game, this.client.player) &&
      (!model.Game.diceWasRolled(game)) &&
      (!game.turnConfirmed)
    );

    var canConfirmMove =
      game.hasStarted &&
      (!game.isOver) &&
      model.Game.isPlayerTurn(game, this.client.player) &&
      model.Game.diceWasRolled(game) &&
      (!model.Game.hasMoreMoves(game)) &&
      (!game.turnConfirmed);

    var canUndoMove =
      game.hasStarted &&
      (!game.isOver) &&
      model.Game.isPlayerTurn(game, this.client.player) &&
      model.Game.diceWasRolled(game) &&
      (!game.turnConfirmed);

    $('#btn-confirm').toggle(canConfirmMove);
    $('#btn-undo').toggle(canConfirmMove);

    $('#menu-resign').toggle(game.hasStarted && (!game.isOver));
    $('#menu-undo').toggle(canUndoMove);

    var showDice = game.hasStarted &&
      (!game.isOver) &&
      model.Game.diceWasRolled(game) &&
      (!game.turnConfirmed);
    $('.dice-panel').toggle(showDice);

    if (showDice) {
      this.updateDice(game.turnDice, game.turnPlayer.currentPieceType);
    }

    console.log('Board UI updated');
    console.log('Match:', this.match);
    console.log('Game:', game);
    console.log('Player:', this.client.player);
  };

  this.updateScoreboard = function () {
    if ((!this.match) || (!this.match.currentGame)) {
      return;
    }

    var isInMatch = (this.match.currentGame);
    var matchText = (isInMatch) ?
      'Match "' + this.rule.title + '", ' + this.match.length + '/' + this.match.length
      :
      'Not in match';
    var matchTextTitle = (isInMatch) ?
      'Playing match with length of ' + this.match.length + ' games and rule "' + this.rule.title + '"'
      :
      'Match has not been started';
    $('#match-state').text(matchText);
    $('#match-state').attr('title', matchTextTitle);

    var yourscore = this.match.score[this.client.player.currentPieceType];
    $('#yourscore').text(yourscore);

    if (this.client.otherPlayer) {
      var oppscore = this.match.score[this.client.otherPlayer.currentPieceType];
      $('#oppscore').text(oppscore);
    }
    else {
      $('#oppscore').text('');
    }
  };

  this.showGameEndMessage = function (winner, resigned) {
    $('#game-result-overlay').show();

    var result = winner.id === this.client.player.id;
    var message;
    var matchState;

    if (resigned) {
      message = (result) ? 'Other player resigned!' : 'You resigned.';
    }
    else {
      message = (result) ? 'You WON!' : 'You lost.';
    }

    matchState = 'Match standing&#160;';
    if (this.match.isOver) {
      message += message = ' Match is over.';
      matchState = 'Match result&#160;';
    }

    var color = (result) ? 'green' : 'red';

    $('.game-result').css('color', color);
    $('.game-result .message').html(message);
    $('.game-result .state').html(matchState);

    var yourscore = this.match.score[this.client.player.currentPieceType];
    var oppscore = this.match.score[this.client.otherPlayer.currentPieceType];
    $('.game-result .yourscore').text(yourscore);
    $('.game-result .oppscore').text(oppscore);

    $('.game-result .text').each(function () {
      fitText($(this));
    });

    if (resigned) {
      this.notifyInfo('Other player resigned from game');
    }
  };

  /**
   * Updates the DOM element representing the specified die (specified by index).
   * Changes CSS styles of the element.
   * @param {Dice} dice - Dice to render
   * @param {number} index - Index of dice value in array
   * @param {PieceType} type - Player's type
   */
  this.updateDie = function (dice, index, type) {
    var color = (type === model.PieceType.BLACK) ? 'black' : 'white';
    var id = '#die' + index;

    // Set text
    $(id).text(dice.values[index]);

    // Change image
    $(id).removeClass('digit-1-white digit-2-white digit-3-white digit-4-white digit-5-white digit-6-white digit-1-black digit-2-black digit-3-black digit-4-black digit-5-black digit-6-black played');
    $(id).addClass('digit-' + dice.values[index] + '-' + color);
    if (dice.movesLeft.length === 0) {
      $(id).addClass('played');
    }

    var angle = this.rotationAngle[index];
    $(id).css('transform', 'rotate(' + angle + 'deg)');
  };

  /**
   * Recreate DOM elements representing dice and render them in dice container.
   * Player's dice are shown in right pane. Other player's dice are shown in
   * left pane.
   * @param {Dice} dice - Dice to render
   * @param {number} index - Index of dice value in array
   * @param {PieceType} type - Player's type
   */
  this.updateDice = function (dice, type) {
    $('.dice').each(function() {
      $(this).empty();
    });

    // Player's dice are shown in right pane.
    // Other player's dice are shown in left pane.
    var diceElem;
    if (type === this.client.player.currentPieceType) {
      diceElem = $('#dice-right');
    }
    else {
      diceElem = $('#dice-left');
    }

    for (var i = 0; i < dice.values.length; i++) {
      diceElem.append('<span id="die' + i + '" class="die"></span>');
      this.updateDie(dice, i, type);
    }

    var self = this;
    $('.dice .die').unbind('click');
    $('.dice .die').click(function (e) {
      if (dice.movesLeft.length > 0) {
        console.log('Values:', dice.values);
        console.log('Moves left:', dice.movesLeft);
        model.Utils.rotateLeft(dice.values);
        model.Utils.rotateLeft(dice.movesLeft);
      }
      self.updateControls();
    });
  };

  this.playActions = function (actionList) {
    for (var i = 0; i < actionList.length; i++) {
      var action = actionList[i];
      if (action.type === model.MoveActionType.MOVE) {
        this.playMoveAction(action);
      }
      else if (action.type === model.MoveActionType.RECOVER) {
        this.playRecoverAction(action);
      }
      else if (action.type === model.MoveActionType.HIT) {
        this.playHitAction(action);
      }
      else if (action.type === model.MoveActionType.BEAR) {
        this.playBearAction(action);
      }
      else if (action.type === model.MoveActionType.UP) {
        this.playUpAction(action);
      }

      // TODO: Make sure actions are played back slow enough for player to see
      // all of them comfortly
    }
  };

  this.playMoveAction = function (action) {
    if (!action.piece) {
      throw new Error('No piece!');
    }

    var pieceElem = this.getPieceElem(action.piece);
    var srcPointElem = pieceElem.parent();
    var dstPointElem = this.getPointElem(action.to);

    pieceElem.detach();
    dstPointElem.append(pieceElem);

    this.compactPosition(srcPointElem.data('position'));
    this.compactPosition(dstPointElem.data('position'));
  };

  this.playRecoverAction = function (action) {
    if (!action.piece) {
      throw new Error('No piece!');
    }

    var pieceElem = this.getPieceElem(action.piece);
    var srcPointElem = pieceElem.parent();
    var dstPointElem = this.getPointElem(action.position);

    pieceElem.detach();
    dstPointElem.append(pieceElem);

    this.compactElement(srcPointElem, action.piece.type === this.client.player.currentPieceType ? 'top' : 'bottom');
    this.compactPosition(dstPointElem.data('position'));
  };

  this.playHitAction = function (action) {
    if (!action.piece) {
      throw new Error('No piece!');
    }

    var pieceElem = this.getPieceElem(action.piece);
    var srcPointElem = pieceElem.parent();
    var dstPointElem = this.getBarElem(action.piece.type);

    pieceElem.detach();
    dstPointElem.append(pieceElem);

    this.compactPosition(srcPointElem.data('position'));
    this.compactElement(dstPointElem, action.piece.type === this.client.player.currentPieceType ? 'top' : 'bottom');
  };

  this.playBearAction = function (action) {
    if (!action.piece) {
      throw new Error('No piece!');
    }

    var pieceElem = this.getPieceElem(action.piece);
    var srcPointElem = pieceElem.parent();

    pieceElem.detach();

    this.compactPosition(srcPointElem.data('position'));
  };

  this.playUpAction = function (action) {
    if (!action.piece) {
      throw new Error('No piece!');
    }

    var pieceElem = this.getPieceElem(action.piece);
    var srcPointElem = pieceElem.parent();
    pieceElem.data('height', action.to);

    this.compactPosition(srcPointElem.data('position'));
  };

  /**
   * Compact pieces after UI was resized
   */
  this.resizeUI = function () {
    this.compactAllPositions();
  };
}

module.exports = SimpleBoardUI;
