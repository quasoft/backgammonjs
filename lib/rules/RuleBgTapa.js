var model = require('../model.js');
var Rule = require('./rule.js');

/**
 * Bulgarian variant of Tapa (тапа).
 * @constructor
 * @extends Rule
 */
function RuleBgTapa() {
  Rule.call(this);

  /**
   * Rule name, matching the class name (eg. 'RuleBgTapa')
   * @type {string}
   */
  this.name = 'RuleBgTapa';

  /**
   * Short title describing rule specifics
   * @type {string}
   */
  this.title = 'Tapa';

  /**
   * Full description of rule
   * @type {string}
   */
  this.description = 'Bulgarian variant of Tapa (тапа).';

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

RuleBgTapa.prototype = Object.create(Rule.prototype);
RuleBgTapa.prototype.constructor = RuleBgTapa;

/**
 * Roll dice and generate list of moves the player has to make according to
 * current rules.
 *
 * In this variant the only specific when rolling dice is that doubles result in
 * four moves, in stead of two, as usual.
 *
 * @memberOf RuleBgTapa
 * @param {Game} game - Game object. Used to check if it is the first turn of the game.
 * @returns {Dice} - Dice object containing random values and allowed moves
 */
RuleBgTapa.prototype.rollDice = function(game) {
  // Create dice object with 2 random values
  var dice = model.Dice.roll();

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
  dice.moves = weight['playableMoves'];  
  
  // Copy move values to movesLeft array. Moves will be removed from movesLeft
  // after being played by player, whereas values in moves array will remain
  // in case the player wants to undo his actions.
  dice.movesLeft = dice.movesLeft.concat(dice.moves);
  
  console.log('Playable moves:', weight['playableMoves']);
  //var maxWeight = weight['max'];

  return dice;
};

/**
 * Reset state to initial position of pieces according to current rule.
 * @memberOf RuleBgTapa
 * @param {State} state - Board state
 */
RuleBgTapa.prototype.resetState = function(state) {
  /**
   * Move pieces to correct initial positions for both players.
   * Values in state.points are zero based and denote the .
   * the number of pieces on each position.
   * Index 0 of array is position 1 and increments to the number of maximum
   * points.
   *
   * Position: |12 13 14 15 16 17| |18 19 20 21 22 23| White
   *           |                 | |              15w| <-
   *           |                 | |                 |
   *           |                 | |                 |
   *           |                 | |                 |
   *           |                 | |              15b| <-
   * Position: |11 10 09 08 07 06| |05 04 03 02 01 00| Black
   *
   */


  model.State.clear(state);

  this.place(state, 15, model.PieceType.WHITE, 23);

  this.place(state, 15, model.PieceType.BLACK, 0);
};

/**
 * Increment position by specified number of steps and return an incremented position
 * @memberOf RuleBgTapa
 * @param {number} position - Denormalized position
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {number} - Incremented position (denormalized)
 */
RuleBgTapa.prototype.incPos = function(position, type, steps) {
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
 * @memberOf RuleBgTapa
 * @param {number} position - Denormalized position (0 to 23 for white and 23 to 0 for black)
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {number} - Normalized position (0 to 23 for both players)
 */
RuleBgTapa.prototype.normPos = function(position, type) {
  var normPosition = position;

  if (type === model.PieceType.BLACK) {
    normPosition = 23 - position;
  }
  return normPosition;
};

/**
 * Get denormalized position - start from 0 to 23 for white player and from
 * 23 to 0 for black player.
 * @memberOf RuleBgTapa
 * @param {number} position - Normalized position (0 to 23 for both players)
 * @param {PieceType} type - Type of piece (white/black)
 * @return {number} - Denormalized position (0 to 23 for white and 23 to 0 for black)
 */
RuleBgTapa.prototype.denormPos = function(position, type) {
  var denormPosition = position;

  if (type === model.PieceType.BLACK) {
    denormPosition = 23 - position;
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
 * @memberOf RuleBgTapa
 * @param {Game} game - Game
 * @param {Player} player - Player requesting move
 * @param {Piece} piece - Piece to move
 * @param {number} steps - Number of steps to make forward to the first home position
 * @returns {boolean} True if move is valid and should be allowed.
 */
RuleBgTapa.prototype.validateMove = function(game, player, piece, steps) {
  var result = Rule.prototype.validateMove.call(this, game, player, piece, steps);
  if (!result) {
    return false;
  }
  
  if (this.isMoveActionRestricted(game.state, game.turnDice.movesLeft, piece, steps)) {
    return false;
  }
  
  return true;
}

/**
 * Recursively try out all combinations for the specified player (by piece type)
 * and check the "weight" of each combination. Weight is the sum of all piece
 * movements for a particular combination of moves (called "branch")
 * @memberOf RuleBgTapa
 * @param {State} state - State
 * @param {number[]} movesLeft - Move values left
 * @param {PieceType} pieceType - Type of piece (white/black)
 * @param {Piece} rootPiece - Check only branches starting from a specific piece
 * @param {boolean} stopAtMax - Stop calculation if a branch that allows all moves to be played has been found.
 * @returns {Object} - Map containing maximum weight for each branch, indexed by piece ID
 *                     and total maximum weight for all branches, accessed with 'max' index
 */
RuleBgTapa.prototype.calculateMoveWeights = function(state, movesLeft, pieceType, rootPiece, stopAtMax) {
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
      
      // Make sure this piece is the top piece at its position. Only top pieces can be moved.
      var pos = model.State.getPiecePos(st, piece);
      if (model.State.getTopPiece(st, pos).id != piece.id) {
        continue;
      }
      //console.log('Pos', pos);

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
}

/**
 * Checks if a specific move action is restricted. If there are any move combinations
 * that would allow the player to use all dice values, then the player is obliged to
 * use one of those combination. If playing both dice values are not possible and the
 * player should choose which one of them to play, they must play the higher value
 * (as long as it is possible).
 *
 * @memberOf RuleBgTapa
 * @param {State} state - State
 * @param {number[]} movesLeft - Move values left
 * @param {Piece} piece - Piece to move
 * @param {number} steps - Number of steps to move
 * @returns {boolean} - Returns true if move is restricted (not allowed).
 */
RuleBgTapa.prototype.isMoveActionRestricted = function(state, movesLeft, piece, steps) {
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
 * a result. Actions can be `move` or `bear`.
 *
 * Multiple actions can be returned, if required.
 *
 * The list of actions returned would usually be appllied to game state and then
 * sent to client. The client's UI would play the actions (eg. with movement animation)
 * in the same order.
 *
 * @memberOf RuleBgTapa
 * @param {State} state - State
 * @param {Piece} piece - Piece to move
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {MoveAction[]} - List of actions if move is allowed, empty list otherwise.
 */
RuleBgTapa.prototype.getMoveActions = function(state, piece, steps) {
  var actionList = [];

  // Next, check conditions specific to this game rule and build the list of
  // actions that has to be made.

  /**
   * Create a new move action and add it to actionList. Used internally.
   *
   * @alias RuleBgTapa.getMoveActions.addAction
   * @memberof RuleBgTapa.getMoveActions
   * @method RuleBgTapa.getMoveActions.addAction
   * @param {MoveActionType} moveActionType - Type of move action (eg. move, bear)
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
        // The top piece is opponent's and is only one (i.e. the point is not blocked),
        // so move ours on top of opponent's piece
        else if (model.State.countAllAtPos(state, destination) === 1) {
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
        If there is at least one piece outside home, just move the piece.
        Input data: position=13, steps=3
        Cases:
          - Opponent has no pieces there --> move the checker at position 10
          - Opponent has exactly one piece --> move out piece over opponent's one
          - Opponent has two or more pieces --> point is blocked, cannot move piece there
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
        // The top piece is opponent's and is a blot (i.e. the point is not blocked)
        else if (model.State.countAllAtPos(state, destination) === 1) {
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
 * Actions can be `move` or `bear`.
 *
 * @memberOf RuleBgTapa
 * @param {State} state - State to change
 * @param {MoveAction[]} actionList - List of action to apply.
 */
RuleBgTapa.prototype.applyMoveActions = function(state, actionList) {
  for (var i = 0; i < actionList.length; i++) {
    var action = actionList[i];

    if (action.type === model.MoveActionType.MOVE) {
      this.move(state, action.piece, action.to);
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
 * @memberOf RuleBgTapa
 * @param {State} state - Game state
 * @param {Player} player - Player
 * @returns {boolean} - True if player has won the game
 */
RuleBgTapa.prototype.hasWon = function (state, player) {
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
 * @memberOf RuleBgTapa
 * @param {State} state - Game state
 * @param {Player} player - Player
 * @returns {boolean} - True if player has won the game
 */
RuleBgTapa.prototype.getGameScore = function (state, player) {
  var oppType = (player.currentPieceType === model.PieceType.WHITE)
    ? model.PieceType.BLACK
    : model.PieceType.WHITE;
  
  if (state.outside[oppType].length <= 0) {
    // The opponent has not borne any pieces, so we need to check
    // if the player should be awarded 2 or 3 points
    if (this.countAtHigherPos(state, 18, oppType) > 0) {
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

module.exports = new RuleBgTapa();
