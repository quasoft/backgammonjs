var model = require('../model.js');
var Rule = require('./rule.js');

/**
 * One of the less popular variants of backgammon in Bulgaria (гюлбара).
 * @constructor
 * @extends Rule
 */
function RuleBgGulbara() {
  Rule.call(this);

  /**
   * Rule name, matching the class name (eg. 'RuleBgGulbara')
   * @type {string}
   */
  this.name = 'RuleBgGulbara';

  /**
   * Short title describing rule specifics
   * @type {string}
   */
  this.title = 'Gul bara';

  /**
   * Full description of rule
   * @type {string}
   */
  this.description = 'One of the less popular variants of backgammon in Bulgaria.';

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
    model.MoveActionType.BEAR
  ];
}

RuleBgGulbara.prototype = Object.create(Rule.prototype);
RuleBgGulbara.prototype.constructor = RuleBgGulbara;

/**
 * Roll dice and generate list of moves the player has to make according to
 * current rules.
 *
 * In this variant of the game moves for doubles are determined in the following way:
 * - In first three dice rolls (counted separately for each player) doubles are played
 *   as four moves - eg. 5:5 is played as [5,5,5,5].
 * - In all dice rolls after that, all doubles with values higher than the rolled one are played sequentially.
 *   For example 4:4 dice is played as [4,4,4,4], then [5,5,5,5] and finally [6,6,6,6],
 *   whereas 5:5 dice is played as [5,5,5,5] and [6,6,6,6].
 * - If the player cannot play all moves, but has moved at least one piece, then the other player
 *   finishes the moves that could not be played and then rolls the dice (as it is his turn).
 *
 * @memberOf RuleBgGulbara
 * @param {Game} game - Game object. Used to check if it is the first turn of the game.
 * @param {number[]} [values] - Optional parameter containing the dice values to use,
 *                              instead of generating random values. Used by some rules
 *                              as RuleBgGulbara.
 * @returns {Dice} - Dice object containing random values and allowed moves
 */
RuleBgGulbara.prototype.rollDice = function(game, values) {
  // Create dice object with 2 random values
  var dice = model.Dice.roll();
  
  if (typeof values !== "undefined") {
    dice.values[0] = values[0];
    dice.values[1] = values[1];
  }

  // Add those values to moves list - the individual moves the player has to make
  dice.moves = dice.moves.concat(dice.values);

  // Dices with equal values are played four times, so add two more moves 
  if (dice.moves[0] == dice.moves[1]) {
    dice.moves = dice.moves.concat(dice.values);
  }

  // Sort moves in descending order for convenience later in enforcing
  // move rules
  dice.moves.sort(function (a, b) { return b - a; });
  
  // TODO: Put in movesLeft only moves that are playable.
  var weight = this.calculateMoveWeights(game.state, dice.moves, game.turnPlayer.currentPieceType, null, true);
  
  // Copy move values to movesLeft array. Moves will be removed from movesLeft
  // after being played by player, whereas values in moves array will remain
  // in case the player wants to undo his actions.
  dice.movesLeft = dice.movesLeft.concat(weight.playableMoves);
  
  console.log('Playable moves:', weight.playableMoves);
  
  console.log('DICE', dice);

  return dice;
};

/**
 * Reset state to initial position of pieces according to current rule.
 * @memberOf RuleBgGulbara
 * @param {State} state - Board state
 */
RuleBgGulbara.prototype.resetState = function(state) {
  /**
   * Move pieces to correct initial positions for both players.
   * Values in state.points are zero based and denote the .
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


  model.State.clear(state);

  this.place(state, 15, model.PieceType.WHITE, 23);

  this.place(state, 15, model.PieceType.BLACK, 11);
};

/**
 * Increment position by specified number of steps and return an incremented position
 * @memberOf RuleBgGulbara
 * @param {number} position - Denormalized position
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {number} - Incremented position (denormalized)
 */
RuleBgGulbara.prototype.incPos = function(position, type, steps) {
  var newPosition;
  if (type === model.PieceType.WHITE) {
    newPosition = position - steps;
  }
  else {
    newPosition = position - steps;
    if ((position < 12) && (newPosition < 0)) {
      newPosition = 24 + newPosition;
    }
    else if ((position >= 12) && (newPosition <= 11)) {
      newPosition = newPosition - 12;
    }
  }
  
  console.log('New pos:', position, newPosition, steps);

  return newPosition;
};

/**
 * Normalize position - Normalized positions start from 0 to 23 for both players,
 * where 0 is the first position in the home part of the board, 6 is the last
 * position in the home part and 23 is the furthest position - in the opponent's
 * home.
 * @memberOf RuleBgGulbara
 * @param {number} position - Denormalized position (0 to 23 for white and 12 to 11 for black)
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {number} - Normalized position (0 to 23 for both players)
 */
RuleBgGulbara.prototype.normPos = function(position, type) {
  var normPosition = position;

  if (type === model.PieceType.BLACK) {
    if (position < 0) {
      normPosition = position;
    }
    else if (position >= 12) {
      normPosition = position - 12;
    }
    else {
      normPosition = position + 12;
    }
  }
  return normPosition;
};

/**
 * Get denormalized position - start from 0 to 23 for white player and from
 * 12 to 11 for black player.
 * @memberOf RuleBgGulbara
 * @param {number} position - Normalized position (0 to 23 for both players)
 * @param {PieceType} type - Type of piece (white/black)
 * @return {number} - Denormalized position (0 to 23 for white and 12 to 11 for black)
 */
RuleBgGulbara.prototype.denormPos = function(position, type) {
  var denormPosition = position;

  if (type === model.PieceType.BLACK) {
    if (position < 0) {
      denormPosition = position;
    }
    else if (position >= 12) {
      denormPosition = position - 12;
    }
    else {
      denormPosition = position + 12;
    }
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
 * @memberOf RuleBgGulbara
 * @param {State} state - State
 * @param {Piece} piece - Piece to move
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {MoveAction[]} - List of actions if move is allowed, empty list otherwise.
 */
RuleBgGulbara.prototype.getMoveActions = function(state, piece, steps) {
  var actionList = [];

  // Next, check conditions specific to this game rule and build the list of
  // actions that has to be made.

  /**
   * Create a new move action and add it to actionList. Used internally.
   *
   * @alias RuleBgGulbara.getMoveActions.addAction
   * @memberof RuleBgGulbara.getMoveActions
   * @method RuleBgGulbara.getMoveActions.addAction
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
    if (typeof to !== "undefined") {
      action.to = to;
    }
    actionList.push(action);
    return action;
  }

  // TODO: Catch exceptions due to disallowed move requests and pass them as error message to the client.
  try {
    var position = model.State.getPiecePos(state, piece);
    
    // TODO: Consider using state machine? Is it worth, can it be useful in other methods too?
    if (this.allPiecesAreHome(state, piece.type)) {
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
          - Opponent has one or more pieces --> point is blocked, cannot place piece there
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
      }
    }
  }
  catch (e) {
    actionList = [];
    return actionList;
  }
  
  return actionList;
};

/**
 * Mark move as played
 * @memberOf RuleBgGulbara
 * @abstract
 * @param {Game} game - Game
 * @param {number} move - Move (number of steps)
 * @returns {boolean} - True if piece was moved/borne/recovered
 */
RuleBgGulbara.prototype.markAsPlayed = function (game, move) {
  // Once a piece is moved, consider that the turn has been started.
  // This flag is used when the player cannot play all moves.
  // Remaining moves are tranfered to other player, only if
  // the turn has been started.
  game.turnStarted = true;
  Rule.prototype.markAsPlayed.call(this, game, move);
};

/**
 * Proceed to next turn.
 *
 * If the player has dice doubles (eg. 4:4), and this is not one of his first
 * three turns, the player is given another turn, with dice values higher with 1.
 *
 * For example, if 4:4 is rolled, the player has one turn to play [4,4,4,4], then
 * another turn to play [5,5,5,5] and a third one to play [6,6,6,6].
 *
 * If the player cannot use all moves, the other player is given a chance
 * to play the remaining moves. After the other player plays the remaining
 * moves (if possibles at all), the other player rolls the dice - its other
 * player's turn.
 * 
 * @memberOf RuleBgGulbara
 * @abstract
 * @param {Match} match - Match
 */
RuleBgGulbara.prototype.nextTurn = function (match) {
  // This method decides if turn has really ended.
  //
  // If turn for current player has ended, `game.turnPlayer` should be
  // switched to other player.
  //
  // If new dice should be rolled, `game.turnDice` should be set to `null`.
  // 
  // If remaining moves are transfered to other player, `game.turnTransfered`
  // should be set to `true`, `game.turnPlayer` should be switched to other player
  // and `game.turnDice.movesLeft` should be set to the remaining moves.
  
  var game = match.currentGame;
  if (game.turnNumber > 6 && model.Dice.isDouble(game.turnDice)) {
    // Check if player was able to use all moves
    if (game.turnDice.movesLeft.length === 0 &&
        game.turnStarted &&
        game.turnDice.moves.length > game.turnDice.movesPlayed.length) {
      console.log('TRANSFER', game.turnDice);
      // Player was not able to use all moves, so let other player
      // finish the remaining moves.
      
      // But keep track who rolled the dice, in case the other
      // player is also not able to play the moves. If that is
      // the case, just proceed to next turn.
      
      // TODO: transfer moves, only if the player has played at least one of the moves
      if (!game.turnTransfered) {
        // Turn has not been transfered to another player,
        // so let other player finish this turn
        game.turnTransfered = true;
        game.turnPlayer = (game.turnPlayer.id == match.host.id) ? match.guest : match.host;
        game.turnStarted = false;
        
        game.turnDice.movesLeft.length = 0;
        var remainingMoves = model.Dice.getRemainingMoves(game.turnDice);
        console.log('Remaining: ', remainingMoves);
        game.turnDice.movesLeft = remainingMoves;
        console.log('After transfer: ', game.turnDice);
      }
      else {
        // Turn has already been transfered once, cannot transfer it anymore.
        // Proceed to next turn, but let other player roll the dice,
        // as he was just playing remaining moves, that was not his turn.
        game.turnTransfered = false;
        game.turnDice = null;
      }
    }
    else {
      // Player was able to use all moves.
      
      // Check if highest die value has been reached.
      if (game.turnDice.values[0] == 6) {
        // Highest double values reached, proceed to next turn.
        
        if (game.turnTransfered) {
          // Player is finishing remaining moves of other player.
          // so  let player start his own turn, after finishing moves.
          game.turnTransfered = false;
          game.turnDice = null;
        } else {
          // Player managed to play all of his double moves,
          // no moves remain to be transfered, so just proceed to
          // next turn.
          game.turnDice = null;
          game.turnPlayer = (game.turnPlayer.id == match.host.id) ? match.guest : match.host;
          game.turnStarted = false;
        }
      }
      else {
        // Give next turn to the same player
        var nextValue = game.turnDice.values[0] + 1;
        var values = [nextValue, nextValue];
        game.turnDice = this.rollDice(game, values);
      }
    }
  }
  else {
    game.turnDice = null;
    game.turnPlayer = (game.turnPlayer.id == match.host.id) ? match.guest : match.host;
    game.turnStarted = false;
  }
  
  game.turnConfirmed = false;
  game.turnNumber += 1;
};

module.exports = new RuleBgGulbara();
