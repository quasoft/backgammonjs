var model = require('../model.js');
var Rule = require('./rule.js');

/**
 * Most popular variant played in Bulgaria called casual (обикновена).
 * @constructor
 * @extends Rule
 */
function RuleBgCasual() {
  Rule.call(this);

  /**
   * Rule name, matching the class name (eg. 'RuleBgCasual')
   * @type {string}
   */
  this.name = 'RuleBgCasual';

  /**
   * Short title describing rule specifics
   * @type {string}
   */
  this.title = 'General';

  /**
   * Full description of rule
   * @type {string}
   */
  this.description = 'Most popular variant of backgammon played in Bulgaria.';

  /**
   * Full name of country where this rule (variant) is played.
   * To list multiple countries use a pipe ('|') character as separator.
   * @type {string}
   */
  this.country = 'Bulgaria';

  /**
   * Two character ISO code of country where this rule (variant) is played.
   * To list multiple codes use a pipe ('|') character as separator.
   * List codes in same order as countries in the field above.
   * @type {string}
   */
  this.countryCode = 'bg';

  /**
   * Descendents should list all action types that are allowed in this rule.
   * @type {MoveActionType[]}
   */
  this.allowedActions = [
    model.MoveActionType.MOVE,
    model.MoveActionType.BEAR,
    model.MoveActionType.HIT,
    model.MoveActionType.RECOVER
  ];
}

RuleBgCasual.prototype = Object.create(Rule.prototype);
RuleBgCasual.prototype.constructor = RuleBgCasual;

/**
 * Reset state to initial position of pieces according to current rule.
 * @memberOf RuleBgCasual
 * @param {State} state - Board state
 */
RuleBgCasual.prototype.resetState = function(state) {
  /**
   * Move pieces to correct initial positions for both players.
   * Values in state.points are zero based and denote the .
   * the number of pieces on each position.
   * Index 0 of array is position 1 and increments to the number of maximum
   * points.
   *
   * Position: |12 13 14 15 16 17| |18 19 20 21 22 23| White
   *           |5w          3b   | |5b             2w| <-
   *           |                 | |                 |
   *           |                 | |                 |
   *           |                 | |                 |
   *           |5b          3w   | |5w             2b| <-
   * Position: |11 10 09 08 07 06| |05 04 03 02 01 00| Black
   *
   */


  model.State.clear(state);

  this.place(state, 5, model.PieceType.WHITE, 5);
  this.place(state, 3, model.PieceType.WHITE, 7);
  this.place(state, 5, model.PieceType.WHITE, 12);
  this.place(state, 2, model.PieceType.WHITE, 23);

  this.place(state, 5, model.PieceType.BLACK, 18);
  this.place(state, 3, model.PieceType.BLACK, 16);
  this.place(state, 5, model.PieceType.BLACK, 11);
  this.place(state, 2, model.PieceType.BLACK, 0);
};

/**
 * Increment position by specified number of steps and return an incremented position
 * @memberOf RuleBgCasual
 * @param {number} position - Denormalized position
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {number} - Incremented position (denormalized)
 */
RuleBgCasual.prototype.incPos = function(position, type, steps) {
  var newPosition;
  if (type === model.PieceType.WHITE) {
    newPosition = position - steps;
  }
  else {
    newPosition = position + steps;
  }

  return newPosition;
};

/**
 * Normalize position - Normalized positions start from 0 to 23 for both players,
 * where 0 is the first position in the home part of the board, 6 is the last
 * position in the home part and 23 is the furthest position - in the opponent's
 * home.
 * @memberOf RuleBgCasual
 * @param {number} position - Denormalized position (0 to 23 for white and 23 to 0 for black)
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {number} - Normalized position (0 to 23 for both players)
 */
RuleBgCasual.prototype.normPos = function(position, type) {
  var normPosition = position;

  if (type === model.PieceType.BLACK) {
    normPosition = 23 - position;
  }
  return normPosition;
};

/**
 * Get denormalized position - start from 0 to 23 for white player and from
 * 23 to 0 for black player.
 * @memberOf RuleBgCasual
 * @param {number} position - Normalized position (0 to 23 for both players)
 * @param {PieceType} type - Type of piece (white/black)
 * @return {number} - Denormalized position (0 to 23 for white and 23 to 0 for black)
 */
RuleBgCasual.prototype.denormPos = function(position, type) {
  var denormPosition = position;

  if (type === model.PieceType.BLACK) {
    denormPosition = 23 - position;
  }
  return denormPosition;
};

/**
 * Call this method after a request for moving a piece has been made.
 * Determines if the move is allowed and what actions will have to be made as
 * a result. Actions can be `move`, `place`, `hit` or `bear`.
 *
 * If move is allowed or not depends on the current state of the game. For example,
 * if the player has pieces on the bar, they will only be allowed to place pieces.
 *
 * Multiple actions can be returned, if required. Placing (or moving) a piece over
 * an opponent's blot will result in two actions: `hit` first, then `place` (or `move`).
 *
 * The list of actions returned would usually be appllied to game state and then
 * sent to client. The client's UI would play the actions (eg. with movement animation)
 * in the same order.
 *
 * @memberOf RuleBgCasual
 * @param {State} state - State
 * @param {Piece} piece - Piece to move
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {MoveAction[]} - List of actions if move is allowed, empty list otherwise.
 */
RuleBgCasual.prototype.getMoveActions = function(state, piece, steps) {
  var actionList = [];

  // Next, check conditions specific to this game rule and build the list of
  // actions that has to be made.

  /**
   * Create a new move action and add it to actionList. Used internally.
   *
   * @alias RuleBgCasual.getMoveActions.addAction
   * @memberof RuleBgCasual.getMoveActions
   * @method RuleBgCasual.getMoveActions.addAction
   * @param {MoveActionType} moveActionType - Type of move action (eg. move, hit, bear)
   * @param {Piece} piece - Piece to move
   * @param {number} from - Denormalized source position. If action uses only one position parameter, this one is used.
   * @param {number} to - Denormalized destination position.
   * @returns {MoveAction}
   * @see {@link getMoveActions} for more information on purpose of move actions.
   */
  function addAction(moveActionType, piece, from, to) {
    var action = new model.MoveAction();
    action.type = moveActionType;
    action.piece = piece;
    action.position = from;
    action.from = from;
    if (typeof to != "undefined") {
      action.to = to;
    }
    actionList.push(action);
    return action;
  }

  // TODO: Catch exceptions due to disallowed move requests and pass them as error message to the client.
  try {
    var position = model.State.getPiecePos(state, piece);
    
    // TODO: Consider using state machine? Is it worth, can it be useful in other methods too?
    if (this.havePiecesOnBar(state, piece.type)) {
        /*
          If there are pieces on the bar, the player can only place pieces on.
          Input data: steps=3
          Cases:
            - Opponent has no pieces there --> place the checker at position 21
            - Opponent has exactly one piece --> hit oponent piece and place at position 21
            - Opponent has two or more pieces --> point is blocked, cannot place piece there
                                            !
          +12-13-14-15-16-17------18-19-20-21-22-23-+
          |    O             | @ | X                |
          |    O             |   | X                |
          |                  |   | X                |
          |                  |   |                  |
          |                  |   |                  |
          |                  |   |                  |
          |                  |   |                  |
          |                  |   |                  |
          |                  |   |                  |
          |                  |   |       O          |
          |                  |   | O  O  O          |
          +11-10--9--8--7--6-------5--4--3--2--1--0-+ -1

        */
      
      if (model.State.isPieceOnBar(state, piece)) {
        // Make sure that the piece that the player wants to move
        // is on the bar
        
        var destination = (piece.type === model.PieceType.WHITE) ? (24 - steps) : (steps - 1);
        var destTopPiece = model.State.getTopPiece(state, destination);
        var destTopPieceType = (destTopPiece) ? destTopPiece.type : null;

        if ((destTopPieceType === null) || (destTopPieceType === piece.type)) {
          // There are no pieces at this point or the top piece is owned by player,
          // so directly place piece from bar to opponent's home field
          
          addAction(
            model.MoveActionType.RECOVER, piece, destination
          );
        }
        else if (model.State.countAtPos(state, destination, destTopPieceType) === 1) {
          // The top piece is opponent's and is only one (i.e. the point is not blocked),
          // so hit opponent's piece from destination and place ours at this position
          
          addAction(
            model.MoveActionType.HIT, destTopPiece, destination
          );

          addAction(
            model.MoveActionType.RECOVER, piece, destination
          );
        }
      }
    }
    else if (this.allPiecesAreHome(state, piece.type)) {
      /*
      If all pieces are in home field, the player can bear pieces
      Cases:
        - Normalized position >= 0 --> Just move the piece
        - Normalized position === -1 --> Bear piece
        - Normalized position < -1 --> Bear piece, only if there are no player pieces at higher positions

        +12-13-14-15-16-17------18-19-20-21-22-23-+
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |    O  O          |
        |                  |   | O  O  O          |
        +11-10--9--8--7--6-------5--4--3--2--1--0-+ -1

      */
      var destination = this.incPos(position, piece.type, steps);
      var normDestination = this.normPos(destination, piece.type);

      // Move the piece, unless point is blocked by opponent
      if (normDestination >= 0) {

        var destTopPiece = model.State.getTopPiece(state, destination);
        var destTopPieceType = (destTopPiece) ? destTopPiece.type : null;

        // There are no pieces at this point or the top piece is owned by player,
        // so just move piece to that position
        if ((destTopPieceType === null) || (destTopPieceType === piece.type)) {
          addAction(
            model.MoveActionType.MOVE, piece, position, destination
          );
        }
        // The top piece is opponent's and is only one (i.e. the point is not blocked),
        // so hit opponent's piece from destination and move ours at this position
        else if (model.State.countAtPos(state, destination, destTopPieceType) === 1) {
          addAction(
            model.MoveActionType.HIT, destTopPiece, destination
          );

          addAction(
            model.MoveActionType.MOVE, piece, position, destination
          );
        }
      }
      // If steps are just enought to reach position -1, bear piece
      else if (normDestination === -1) {
        addAction(
          model.MoveActionType.BEAR, piece, position
        );
      }
      // If steps move the piece beyond -1 position, the player can bear the piece,
      // only if there are no other pieces at higher positions
      else {
        var normSource = this.normPos(position, piece.type);
        if (this.countAtHigherPos(state, normSource + 1, piece.type) <= 0) {
          addAction(
            model.MoveActionType.BEAR, piece, position
          );
        }
      }
    }
    else {
      /*
        If there are no pieces at bar, and at least one piece outside home,
        just move the piece.
        Input data: position=13, steps=3
        Cases:
          - Opponent has no pieces there --> place the checker at position 10
          - Opponent has exactly one piece --> hit oponent piece and place at position 10
          - Opponent has two or more pieces --> point is blocked, cannot place piece there
                                          !
        +12-13-14-15-16-17------18-19-20-21-22-23-+
        |    O             |   | X                |
        |    O             |   | X                |
        |                  |   | X                |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |                  |
        |                  |   |       O          |
        |                  |   | O  O  O          |
        +11-10--9--8--7--6-------5--4--3--2--1--0-+ -1
             !
      */

      var destination = this.incPos(position, piece.type, steps);

      // Make sure that destination is within board
      if ((destination >= 0) && (destination <= 23)) {
        var normDest = this.normPos(destination, piece.type);
        // TODO: Make sure position is not outside board

        var destTopPiece = model.State.getTopPiece(state, destination);
        var destTopPieceType = (destTopPiece) ? destTopPiece.type : null;

        // There are no pieces at this point or the top piece is owned by player
        if ((destTopPieceType === null) || (destTopPieceType === piece.type)) {
          addAction(
            model.MoveActionType.MOVE, piece, position, destination
          );
        }
        // The top piece is opponent's and is a blot (i.e. the point is not blocked)
        else if (model.State.countAtPos(state, destination, destTopPieceType) === 1) {
          addAction(
            model.MoveActionType.HIT, destTopPiece, destination
          );

          addAction(
            model.MoveActionType.MOVE, piece, position, destination
          );
        }
      }
    }
  }
  catch (e) {
    actionList = [];
    return actionList;
  }
  
  return actionList;
};

module.exports = new RuleBgCasual();
