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
   * @type {Match}
   */
  this.match = null;

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
   * Assign actions to DOM elements
   */
  this.assignActions = function () {
    console.log('assignActions');
    var self = this;
    
    // Game actions
    $('#btn-start').unbind('click');
    $('#btn-start').click(function (e) {
      self.client.reqStartMatch();
    });

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
    
    console.log('mm1', this.match);
    if ((!this.match) || (!this.match.currentGame) || (!this.client.player)) {
      return;
    }
    console.log('mm2', this.match);
    console.log('mm3', this.match.currentGame);
    
    // Actions for points
    for (var pos = 0; pos < 24; pos++) {
      var pointElem = this.getPointElem(pos);

      $(document).on('contextmenu', pointElem, function(e){
         // Block browser menu
      });
      
      pointElem.unbind('mousedown');
      pointElem.mousedown(function(e) {
        var game = self.match.currentGame;
        
        console.log('mousedown click', game);
        if (!model.Game.hasMoreMoves(game)) {
          return;
        }

        var movesLeft = game.turnDice.movesLeft;
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
        var piece = self.getTopPiece(position);
        if (piece) {
          self.client.reqMove(piece, steps);  
        }

        e.preventDefault();

        //return false;
      });
    }
    
    // Actions for bar
    for (var pieceType = 0; pieceType <= model.PieceType.BLACK; pieceType++) {
      console.log('pieceType', pieceType);
      var barElem = this.getBarElem(pieceType);
      console.log(barElem);
      
      $(document).on("contextmenu", barElem, function(e){
         // Block browser menu
      });
      
      /*
      function HandleClick(pieceType) {
        this.handleEvent = function(e) {
          if (!model.Game.hasMoreMoves(game)) {
            return;
          }

          var movesLeft = game.turnDice.movesLeft;
          var steps;
          // If right mouse button was pressed, play last die value
          if (e.which == 3) {
            steps = movesLeft[movesLeft.length - 1];
          }
          // If left mouse button was pressed, play first die value
          else {
            steps = movesLeft[0];
          }
          var piece = self.getBarTopPiece(pieceType);
          console.log('Piece:', piece);
          if (piece) {
            self.client.reqMove(piece, steps);  
          }

          e.preventDefault();

          //return false; 
        }
      };  
      */
      
      barElem.unbind('mousedown');
      barElem.mousedown(function(e) {
        var game = self.match.currentGame;
        
        if (!model.Game.hasMoreMoves(game)) {
          return;
        }

        var movesLeft = game.turnDice.movesLeft;
        var steps;
        // If right mouse button was pressed, play last die value
        if (e.which == 3) {
          steps = movesLeft[movesLeft.length - 1];
        }
        // If left mouse button was pressed, play first die value
        else {
          steps = movesLeft[0];
        }
        var pieceElem = $(this).find('div.piece').last();
        var piece = pieceElem.data('piece');
        console.log('Piece:', piece);
        if (piece) {
          self.client.reqMove(piece, steps);  
        }

        e.preventDefault();

        //return false;
      });
      
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
  };
  
  /**
   * Compact pieces in all positions
   */
  this.compactAllPositions = function () {
    for (var i = 0; i < 24; i++) {
      this.compactPosition(i);
    }
    this.compactElement(this.getBarElem(model.PieceType.WHITE));
    this.compactElement(this.getBarElem(model.PieceType.BLACK));
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
  };

  this.createPieces = function () {
    var game = this.match.currentGame;
    
    for (var pos = 0; pos < game.state.points.length; pos++) {
      var point = game.state.points[pos];
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
    var game = this.match.currentGame;
    
    for (var pos = 0; pos < game.state.points.length; pos++) {
      var point = game.state.points[pos];
      var pointElem = this.getPointElem(pos);
      pointElem.empty();
    }
  };

  /**
   * Reset board UI
   * @param {Match} match - Match
   * @param {Rule} rule - Rule
   */
  this.resetBoard = function (match, rule) {
    this.match = match;
    this.rule = rule;

    this.removePoints();

    this.createPoints();
    this.createPieces();
    
    this.assignActions();
    this.updateControls();
    this.updateScoreboard();
    
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

  this.updateControls = function () {

    if ((!this.match) || (!this.match.currentGame)) {
      $('#btn-start').hide();
      $('#btn-roll').hide();
      $('#btn-confirm').hide();
      $('#btn-undo').hide();
      $('#menu-resign').hide();
      $('#menu-undo').hide();
      return;
    }
    
    var game = this.match.currentGame;    

    $('#btn-start').toggle(
      model.Match.isHost(this.match, this.client.player)
      &&
      (!game.hasStarted)
    );

    $('#btn-roll').toggle(
      game.hasStarted && (!game.isOver)
      &&
      model.Game.isPlayerTurn(game, this.client.player)
      &&
      (!model.Game.diceWasRolled(game))
      &&
      (!game.turnConfirmed)
    );
    
    var canConfirmMove =
      game.hasStarted && (!game.isOver)
      &&
      model.Game.isPlayerTurn(game, this.client.player)
      &&
      model.Game.diceWasRolled(game)
      &&
      (!model.Game.hasMoreMoves(game))
      &&
      (!game.turnConfirmed);

    var canUndoMove =
      game.hasStarted && (!game.isOver)
      &&
      model.Game.isPlayerTurn(game, this.client.player)
      &&
      model.Game.diceWasRolled(game)
      &&
      (!game.turnConfirmed);
    
    $('#btn-confirm').toggle(canConfirmMove);
    $('#btn-undo').toggle(canConfirmMove);
    
    $('#menu-resign').toggle(game.hasStarted && (!game.isOver));
    $('#menu-undo').toggle(canUndoMove);

    var showDice = game.hasStarted
      &&
      (!game.isOver)
      &&
      model.Game.diceWasRolled(game)
      &&
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
    var matchText = (isInMatch)
      ? ('Match "' + this.rule.title + '", ' + this.match.length + '/' + this.match.length)
      : 'Not in match';
    var matchTextTitle = (isInMatch)
      ? ('Playing match with length of ' + this.match.length + ' games and rule "' + this.rule.title + '"')
      : 'Match has not been started';
    $('#match-state').text(matchText);
    $('#match-state').attr('title', matchTextTitle);
    
    var yourscore = this.match.score[this.client.player.currentPieceType];
    var oppscore = this.match.score[this.client.otherPlayer.currentPieceType];
    
    $('#yourscore').text(yourscore);
    $('#oppscore').text(oppscore);
  };
  
  this.showGameEndMessage = function (winner) {
    $('#game-result-overlay').show();
    
    var result = winner.id == this.client.player.id;
    if (this.match.isOver) {
      var message = (result) ? 'You WON the match!' : 'You lost the match.';
      var matchState = 'Match result: ';
    }
    else {
      var message = (result) ? 'You WON!' : 'You lost.';
      var matchState = 'Match standing ';
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
  }

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
    $(id).html(dice.values[index]);
    
    // Change image
    $(id).removeClass('digit-1-white digit-2-white digit-3-white digit-4-white digit-5-white digit-6-white digit-1-black digit-2-black digit-3-black digit-4-black digit-5-black digit-6-black played');
    $(id).addClass('digit-' + dice.values[index] + '-' + color);
    if (dice.movesLeft.length == 0) {
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
    //Other player's dice are shown in left pane.
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
      console.log(dice.movesLeft);
      model.Utils.rotateLeft(dice.movesLeft);
      self.updateControls();
    });
  };

  this.playActions = function (actionList) {
    for (var i = 0; i < actionList.length; i++) {
      var action = actionList[i];
      if (action.type === model.MoveActionType.MOVE) {
        if (action.piece == null) {
          throw new Error('No piece!');
        }

        var pieceElem = this.getPieceElem(action.piece);
        var srcPointElem = pieceElem.parent();
        var dstPointElem = this.getPointElem(action.to);

        pieceElem.detach();
        dstPointElem.append(pieceElem);

        this.compactPosition(srcPointElem.data('position'));
        this.compactPosition(dstPointElem.data('position'));
      }
      else if (action.type === model.MoveActionType.RECOVER) {
        if (action.piece == null) {
          throw new Error('No piece!');
        }
        
        var pieceElem = this.getPieceElem(action.piece);
        var srcPointElem = pieceElem.parent();
        var dstPointElem = this.getPointElem(action.position);

        pieceElem.detach();
        dstPointElem.append(pieceElem);

        this.compactElement(srcPointElem, action.piece.type === this.client.player.currentPieceType ? 'top' : 'bottom');
        this.compactPosition(dstPointElem.data('position'));
      }
      else if (action.type === model.MoveActionType.HIT) {
        if (action.piece == null) {
          throw new Error('No piece!');
        }

        var pieceElem = this.getPieceElem(action.piece);
        var srcPointElem = pieceElem.parent();
        var dstPointElem = this.getBarElem(action.piece.type);

        pieceElem.detach();
        dstPointElem.append(pieceElem);

        this.compactPosition(srcPointElem.data('position'));
        this.compactElement(dstPointElem, action.piece.type === this.client.player.currentPieceType ? 'top' : 'bottom');
      }
      else if (action.type === model.MoveActionType.BEAR) {
        if (action.piece == null) {
          throw new Error('No piece!');
        }

        var pieceElem = this.getPieceElem(action.piece);
        var srcPointElem = pieceElem.parent();

        pieceElem.detach();

        this.compactPosition(srcPointElem.data('position'));
      }

      // TODO: Make sure actions are played back slow enough for player to see
      // all of them comfortly
    }
  };
  
  /**
   * Compact pieces after UI was resized
   */
  this.resizeUI = function () {
    this.compactAllPositions();
  };
}

module.exports = SimpleBoardUI;
