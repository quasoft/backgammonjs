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

  // After the first turn has finished, dices with equal values
  // are played four times, so add two more moves
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
  dice.movesLeft = dice.movesLeft.concat(weight['playableMoves']);
  
  console.log('Playable moves:', weight['playableMoves']);
  
  console.log('DICE', dice);

  return dice;
};

/**
 * Reset state to initial position of pieces according to current rule.
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
    if (position >= 12) {
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
    if (position >= 12) {
      normPosition = position - 12;
    }
    else {
      normPosition = position + 12;
    }
  }
  return denormPosition;
};

/**
 * Validate piece move.
 *
 * This is the base method for validation of moves that make a few general
 * checks like:
 * - Is the game started and is finished?
 * - Is it player's turn?
 * - Was dice rolled?
 * - Are moves with values equal to the steps left?
 *
 * Descendant rules must extend this method and add additional validation checks
 * according to the rule specifics.
 *
 * @memberOf RuleBgGulbara
 * @param {Game} game - Game
 * @param {Player} player - Player requesting move
 * @param {Piece} piece - Piece to move
 * @param {number} steps - Number of steps to make forward to the first home position
 * @returns {boolean} True if move is valid and should be allowed.
 */
RuleBgGulbara.prototype.validateMove = function(game, player, piece, steps) {
  var result = Rule.prototype.validateMove.call(this, game, player, piece, steps);
  if (!result) {
    return false;
  }
  
  if (this.isMoveActionRestricted(game.state, game.turnDice.movesLeft, piece, steps)) {
    return false;
  }
  
  return true;
};

/**
 * Recursively try out all combinations for the specified player (by piece type)
 * and check the "weight" of each combination. Weight is the sum of all piece
 * movements for a particular combination of moves (called "branch")
 * @param {State} state - State
 * @param {number[]} movesLeft - Move values left
 * @param {PieceType} pieceType - Type of piece (white/black)
 * @param {Piece} rootPiece - Check only branches starting from a specific piece
 * @param {boolean} stopAtMax - Stop calculation if a branch that allows all moves to be played has been found.
 * @returns {Object} - Map containing maximum weight for each branch, indexed by piece ID
 *                     and total maximum weight for all branches, accessed with 'max' index
 */
RuleBgGulbara.prototype.calculateMoveWeights = function(state, movesLeft, pieceType, rootPiece, stopAtMax) {
  var weight = {};
  weight['max'] = 0;
  weight['playableMoves'] = [];
  
  var self = this;
  
  var movesLeftSum = 0;
  for (var i = 0; i < movesLeft.length; i++) {
    movesLeftSum += movesLeft[i];
  }
  
  // TODO: Replace recursion with linear loop over a queue
  //       Don't check moves twice (eg. 5:2 and 2:5 for the same pieces)
  
  function calculateBranchWeights(st, moves, id, branchSum, level, branchMoves) {
    // 1. Try out all possible moves (for all of player's pieces).
    // 2. Sum the move values for all resulting branches with possible moves.
    // 3. Check if the move request of the player can be used in a branch that allows
    //    all move values to be used.
    // 4. If there are no better branches than the one chosen by the player, allow the
    //    move
    
    /**
     * Check if recursion should stop because a branch that allows
     * the player to use all moves has been found.
     */
    function shouldStop() {
      if (typeof stopAtMax != 'undefined' && stopAtMax) {
        // If a branch that allows the player to use all moves
        // has been found, do not iterate other branches
        if (weight['max'] >= movesLeftSum) {
          console.log('Stop permutations. A branch was found that allows all moves to be played');
          return true;
        }
      }
      return false;
    }
    
    /** Local copy of moves left */
    var movesLeft = moves.slice();
    
    // Get steps (value) for next move
    var steps = movesLeft.shift();
    if (steps == null) {
      return;
    }
    
    //console.log('Piece type:', pieceType);
    console.log(Array(level + 2).join("-") + ' Begin consider move ' + steps);
    
    // Iterate all of player's pieces
    for (var p = 0; p < st.pieces[pieceType].length; p++) {
      var piece = st.pieces[pieceType][p];
      if ((piece == null) || (piece.type != pieceType)) {
        continue;
      }
      
      // If a root piece has been specified, check
      // only the branches that start at this piece.
      // Ignore other branches
      if (level == 0 && typeof rootPiece != 'undefined' && rootPiece) {
        if (rootPiece.id != piece.id) {
          continue;
        }
      }
      
      // Do not check pieces that are already outside the board
      if (model.State.isPieceOutside(st, piece)) {
        continue;
      }
      
      console.log('Piece ID', piece.id);
      console.log('Outside', st.outside);
      if (piece.id === 5) {
        console.log('TEN');
        console.log(piece.type);
        console.log(st.outside[0].length);
        console.log(st.outside[0]);
        console.log(st.outside);
        console.log(pieceType);
      }
      
      // Check if the player has any pieces on bar. If that is the
      // case only pieces on the bar can be moved
      if (model.State.havePiecesOnBar(st, pieceType)) {
        // Player can only move the top piece on the bar.
        // If there are more pieces on the bar they could be moved on next
        // move, but not on this one
        if (model.State.getBarTopPiece(st, pieceType).id != piece.id) {
          continue;
        }
        //console.log('Bar');
      }
      else {
        // If there are no pieces on the bar, make sure this piece is the
        // top piece at its position. Only top pieces can be moved
        var pos = model.State.getPiecePos(st, piece);
        if (model.State.getTopPiece(st, pos).id != piece.id) {
          continue;
        }
        //console.log('Pos', pos);
      }

      // Make a deep copy of the state. Moves will be applied to the copy. The
      // copy will be passed one level down - to the move (next node of the branch).
      var tempState = model.Utils.deepCopy(st);
      
      // Check if current piece can be moved
      var actions = self.getMoveActions(tempState, piece, steps);
      //console.log('Piece ID', piece.id);
      if (actions.length == 0) {
        //console.log('No actions, next piece');
        continue;
      }
      
      // If yes, apply the move action to the temporary state.
      //console.log('Actions', actions);
      self.applyMoveActions(tempState, actions);
      
      var tempMoves = branchMoves.slice();
      tempMoves.push(steps);
      
      // If we are still at level 0, create a new branch
      var pieceID = (id != 0) ? id: piece.id;
      if (!weight[pieceID]) {
        weight[pieceID] = {
          max: 0,
          moves: []
        };
      }
      
      // Keep track of the maximum weight for this branch. The branch starts with the first
      // piece moved (the root node) and check if the moves in this branch (in the nodes so far,
      // it might extend on next recursion) have a total sum greather than the one saved for this
      // branch (the root node - associated with the first piece being moved).
      
      var w = branchSum + steps;
      
      if (w > weight[pieceID].max) {
        weight[pieceID].max = w;
      }
      weight[pieceID].moves = tempMoves;
      
      if (w > weight['max']) {
        weight['max'] = w;
        weight['playableMoves'] = tempMoves;
      }
      
      if (shouldStop()) {
        return;
      }

      if (movesLeft.length > 0) {
        calculateBranchWeights(tempState, movesLeft, pieceID, w, level + 1, tempMoves);
      }
    }
    
    console.log(Array(level + 2).join("-") + ' End consider move ' + steps);
  }
  
  console.time('Recursion time');
  
  // Simulate moving the piece with all dice values, starting from highest die value
  // (eg. for dice 5:3 try moving 5 first and after that 3). Try this for all pieces
  // (multiple branches)
  console.log('moves 1:', movesLeft);
  calculateBranchWeights(state, movesLeft, 0, 0, 0, []);
  console.log('Intermediate weight:', weight);
  
  // Then try playing from lowest die value first
  // (eg. for dice 5:3 try moving 3 first and after that 5). Also try this for all pieces
  // (more branches)
  // No need to do that for pair values (eg. 5:5)
  if ((movesLeft.length > 1) && (movesLeft[0] != movesLeft[movesLeft.length - 1])) {
    movesLeft = movesLeft.slice();
    movesLeft.reverse();
    console.log('moves2:', movesLeft);
    calculateBranchWeights(state, movesLeft, 0, 0, 0, []);
  }
  console.log('Final weight:', weight);

  
  console.timeEnd('Recursion time');
  
  return weight;
};

/**
 * Checks if a specific move action is restricted. If there are any move combinations
 * that would allow the player to use all dice values, then the player is obliged to
 * use one of those combination. If playing both dice values are not possible and the
 * player should choose which one of them to play, they must play the higher value
 * (as long as it is possible).
 *
 * @memberOf RuleBgGulbara
 * @param {State} state - State
 * @param {number[]} movesLeft - Move values left
 * @param {Piece} piece - Piece to move
 * @param {number} steps - Number of steps to move
 * @returns {boolean} - Returns true if move is restricted (not allowed).
 */
RuleBgGulbara.prototype.isMoveActionRestricted = function(state, movesLeft, piece, steps) {
  // 1. Try out all possible moves (for all of player's pieces).
  // 2. Sum the move values for all resulting branches with possible moves.
  // 3. Check if the move request of the player can be used in a branch that allows
  //    all move values to be used.
  // 4. If there are no better branches than the one chosen by the player, allow the
  //    move
  
  var weight = this.calculateMoveWeights(state, movesLeft, piece.type, piece, false);
  var maxWeight = weight['max'];
  
  if ((!weight[piece.id]) || (weight[piece.id].max < maxWeight)) {
    console.log('There is better move. Piece weight:', weight[piece.id]);
    return true;
  }

  return false;
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
        if ((destTopPieceType == null) || (destTopPieceType === piece.type)) {
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
        if ((destTopPieceType == null) || (destTopPieceType === piece.type)) {
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
 * Call this method to apply a list of actions to a game state.
 * Actions can be `move`, `place`, `hit` or `bear`.
 *
 * @memberOf RuleBgGulbara
 * @param {State} state - State to change
 * @param {MoveAction[]} actionList - List of action to apply.
 */
RuleBgGulbara.prototype.applyMoveActions = function(state, actionList) {
  for (var i = 0; i < actionList.length; i++) {
    var action = actionList[i];

    if (action.type === model.MoveActionType.MOVE) {
      this.move(state, action.piece, action.to);
    }
    else if (action.type === model.MoveActionType.RECOVER) {
      this.recover(state, action.piece, action.position);
    }
    else if (action.type === model.MoveActionType.HIT) {
      this.hit(state, action.piece);
    }
    else if (action.type === model.MoveActionType.BEAR) {
      this.bear(state, action.piece);
    }
  }
};

/**
 * Check game state and determine if the specified player has won the game.
 * This method assumes that the specified player was on turn and has played
 * and confirmed his move.
 * 
 * The player has won if all of his pieces are outside the board.
 *
 * @memberOf RuleBgGulbara
 * @param {State} state - Game state
 * @param {Player} player - Player
 * @returns {boolean} - True if player has won the game
 */
RuleBgGulbara.prototype.hasWon = function (state, player) {
  console.log('hasWon');
  console.log(player.currentPieceType);
  console.log(state.outside[player.currentPieceType]);
  console.log(this.maxPieces);
  return state.outside[player.currentPieceType].length === this.maxPieces;
};

/**
 * Check game state and determine how much points the player
 * should be awared for this state.
 * 
 * If opponent player has not borne any pieces, award 2 points.
 * If opponent has not borne any pieces, and still has pieces in home field of player, award 3 points.
 * In all other cases award 1 point.
 *
 * @memberOf RuleBgGulbara
 * @param {State} state - Game state
 * @param {Player} player - Player
 * @returns {boolean} - True if player has won the game
 */
RuleBgGulbara.prototype.getGameScore = function (state, player) {
  var oppType = (player.currentPieceType === model.PieceType.WHITE)
    ? model.PieceType.BLACK
    : model.PieceType.WHITE;
  
  if (state.outside[oppType].length <= 0) {
    // The opponent has not borne any pieces, so we need to check
    // if the player should be awarded 2 or 3 points
    if ((this.countAtHigherPos(state, 18, oppType) > 0) || (model.State.havePiecesOnBar(state, oppType))) {
      return 3;
    }
    else {
      return 2;
    }
  }
  else {
    // The opponent has already borne a piece, so player
    // receives only one point
    return 1;
  }
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
    if (game.turnDice.movesLeft.length == 0 &&
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
