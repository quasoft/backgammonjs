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
  
  this.getBarElem = function (type) {
    var barID = (type === this.client.player.currentPieceType) ? 'top-bar' : 'bottom-bar';
    var bar = $('#' + barID);
    return bar;
  };

  this.getBarPieceElem = function (type) {
    var barElem = this.getBarElem(type);
    var pieceElem = barElem.find('div.piece').last();
    
    return pieceElem;
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
    
    // TODO: Use contextmenu instead of mousedown and block
    //       browser menu
    /*
    $(document).on("contextmenu", pointElem, function(e){
       alert('Context Menu event has fired!');
       return false;
    });
    */
    
    $(document).on("contextmenu", pointElem, function(e){
       //return false;
    });
    
    pointElem.mousedown(function(e) {
    //pointElem.click(function (e) {
      if (!model.Game.hasMoreMoves(self.game)) {
        return;
      }

      var movesLeft = self.game.turnDice.movesLeft;
      var steps;
      // If right mouse button was pressed, play last die value
      if (e.which == 3) {
        steps = movesLeft[movesLeft.length - 1];
      }
      // If left mouse button was pressed, play first die value
      else {
        steps = movesLeft[0];
      }
      var position = $(this).data('position');
      //var piece = self.getTopPiece(position);
      self.client.reqMove(position, null, steps);
      
      e.preventDefault();
      
      //return false;
    });
  };

  this.createPoints = function () {
    /*
      Fields are numbered in the following way,
      no matter what pieces the user is playing with:
      - Field 0 - top left
      - Field 1 - bottom left
      - Field 2 - top right
      - Field 3 - bottom right
      
      If use is playing with white piece, the fields
      are mapped to point positions in the following
      way.
      
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
      
      The fieldsMap object is used to swap top and bottom points,
      depending on player's piece type.
    */
    
    var fieldsMap = {};    
    
    if (this.client.player.currentPieceType === model.PieceType.BLACK) {
      fieldsMap[0] = 1;
      fieldsMap[1] = 0;
      fieldsMap[2] = 3;
      fieldsMap[3] = 2;
    }
    else {
      fieldsMap[0] = 0;
      fieldsMap[1] = 1;
      fieldsMap[2] = 2;
      fieldsMap[3] = 3;
    }
    
    for (var i = 12; i < 18; i++) {
      var typeClass = i % 2 === 0 ? 'even' : 'odd';
      this.createPoint(this.fields[fieldsMap[0]], i, typeClass);
    }

    for (var i = 11; i >= 6; i--) {
      var typeClass = i % 2 === 0 ? 'even' : 'odd';
      this.createPoint(this.fields[fieldsMap[1]], i, typeClass);
    }

    for (var i = 18; i < 24; i++) {
      var typeClass = i % 2 === 0 ? 'even' : 'odd';
      this.createPoint(this.fields[fieldsMap[2]], i, typeClass);
    }

    for (var i = 5; i >= 0; i--) {
      var typeClass = i % 2 === 0 ? 'even' : 'odd';
      this.createPoint(this.fields[fieldsMap[3]], i, typeClass);
    }
  };

  this.createPiece = function (pos, piece, count) {
    var pieceTypeClass = piece.type === model.PieceType.WHITE ? 'white' : 'black';

    var pieceElem = $('<div id="piece' + piece.id + '" class="piece ' + pieceTypeClass + '"><div class="image">&nbsp;</div></div>');
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
   * Compact pieces in all positions
   */
  this.compactAllPositions = function () {
    for (var i = 0; i < 24; i++) {
      this.compactPosition(i);
    }
  }
  
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
      
      /*
      var marginPercent = ratio * i;
      var negAlignment = (alignment === 'top') ? 'bottom' : 'top';
      element.children().css(alignment, "0");
      element.children().css("margin-" + alignment, this.toFixedDown(marginPercent, 2) + "%");
      element.children().css(negAlignment, "inherit");
      element.children().css("margin-" + negAlignment, "inherit");
      */
      
      var self = this;
      element.children().each(function(i) {
        var marginPercent = ratio * i;
        var negAlignment = (alignment === 'top') ? 'bottom' : 'top';
        
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
    return;
    
    var point = this.game.state.points[pos];
    var pointElement = this.getPointElem(pos);
    var pointHeight = pointElement.height();

    if (point.length > 0) {
      var firstPieceElement = this.getPieceByID(point[0].id);
      var pieceHeight = (firstPieceElement) ? firstPieceElement.width() : 0;
      var ratio = 100;
      var overflow = (pieceHeight * point.length) - pointHeight;

      if ((overflow > 0) && (pieceHeight > 0) && (point.length > 1))
      {
        // Example:
        // pieceHeight = 88
        // offset per piece = 8
        // margin in percent = 100 - ((8 / 88) * 100)
        ratio = 100 - (((overflow / (point.length - 1)) / pieceHeight) * 100);
      }
      
      if (ratio > 100) {
        ratio = 100;
      }
      if (ratio <= 0) {
        ratio = 1;
      }

      for (var i = 0; i < point.length; i++) {
        var piece = point[i];
        var pieceElement = this.getPieceByID(piece.id);
        var marginPercent = ratio * i;

        var alignment = ((pos >= 12) && (pos <= 23)) ? 'top' : 'bottom';
        var negAlignment = ((pos >= 12) && (pos <= 23)) ? 'bottom' : 'top';

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
      this.compactPosition(pos);
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
    
    this.randomizeDiceRotation();
  };
  
  this.handleTurnStart = function () {
    this.randomizeDiceRotation();
  };
  
  this.randomizeDiceRotation = function () {
    this.rotationAngle = [];
    for (var i = 0; i < 10; i++) {
      this.rotationAngle[i] = Math.random() * 30 - 15;  
    }
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

    if ((!this.game) || (this.game == null)) {
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
      this.updateDice(this.game.turnDice, this.game.turnPlayer.currentPieceType);
    }

    console.log('Board UI updated');
    console.log('Game:', this.game);
    console.log('Player:', this.client.player);
  };

  this.updateDie = function (dice, index, type) {
    var color = (type === model.PieceType.BLACK) ? 'black' : 'white';
    var id = '#die' + index;
    
    // Set text
    $(id).html(dice.movesLeft[index]);
    
    // Change image
    $(id).removeClass('digit-1-white digit-2-white digit-3-white digit-4-white digit-5-white digit-6-white digit-1-black digit-2-black digit-3-black digit-4-black digit-5-black digit-6-black');
    $(id).addClass('digit-' + dice.movesLeft[index] + '-' + color);
    
    var angle = this.rotationAngle[index];
    $(id).css('transform', 'rotate(' + angle + 'deg)');
  };

  this.updateDice = function (dice, type) {
    $('#dice').empty();
    for (var i = 0; i < dice.movesLeft.length; i++) {
      $('#dice').append('<span id="die' + i + '" class="die"></span>');
      this.updateDie(dice, i, type);
    }
    
    var self = this;
    $('#dice .die').click(function (e) {
      console.log(dice.movesLeft);
      model.Utils.rotateLeft(dice.movesLeft);
      self.updateControls();
    });
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

        this.compactPosition(srcPointElem.data('position'));
        this.compactPosition(dstPointElem.data('position'));
      }
      else if (action.type === model.MoveActionType.RECOVER) {
        var pieceElem = this.getBarPieceElem(action.pieceType);
        var piece = pieceElem.data('piece');
        var srcPointElem = pieceElem.parent();
        var dstPointElem = this.getPointElem(action.position);

        pieceElem.detach();
        dstPointElem.append(pieceElem);

        this.compactElement(srcPointElem, action.pieceType === this.client.player.currentPieceType ? 'top' : 'bottom');
        this.compactPosition(dstPointElem.data('position'));
      }
      else if (action.type === model.MoveActionType.HIT) {
        var piece = this.getTopPiece(action.position);
        if (piece.type !== action.pieceType) {
          throw new Error('Wrong piece type!');
        }

        var pieceElem = this.getTopPieceElem(action.position);
        var srcPointElem = pieceElem.parent();
        var dstPointElem = this.getBarElem(action.pieceType);

        pieceElem.detach();
        dstPointElem.append(pieceElem);

        this.compactPosition(srcPointElem.data('position'));
        this.compactElement(dstPointElem, action.pieceType === this.client.player.currentPieceType ? 'top' : 'bottom');
      }
      else if (action.type === model.MoveActionType.BEAR) {
        var piece = this.getTopPiece(action.position);
        if (piece.type !== action.pieceType) {
          throw new Error('Wrong piece type!');
        }

        var pieceElem = this.getTopPieceElem(action.position);
        var srcPointElem = pieceElem.parent();

        pieceElem.detach();

        this.compactPosition(srcPointElem.data('position'));
      }

      // TODO: Make sure actions are played back slow enough for player to see
      // all of them comfortly
    }
  }
  
  /**
   * Compact pieces after UI was resized
   */
  this.resizeUI = function () {
    this.compactAllPositions();
  };
}

module.exports = SimpleBoardUI;
