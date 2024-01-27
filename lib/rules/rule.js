var model = require('../model.js');

/**
 * Rules define specific characteristics of each variant of the game.
 * All rules should inherit from this base class and define the following
 * properties:
 * - Maximum number of points (usually 26 - 24 on board, one on bar, and one outside)
 * - Maximum number of checkers (usually 15 per player/colour)
 * and methods for:
 * - Rolling dice (and a list of moves the player has to make
 *   after drawing a specific dice)
 * - Reset state to initial position of pieces.
 * - Validating a move
 * - Checking if game has ended
 * - Checking which player won
 * - Checking how much points the player won
 * @constructor
 * @abstract
 */
function Rule() {
  if (this.constructor === Rule) {
    throw new Error("Can't instantiate abstract class!");
  }

  /**
   * Rule name, matching the class name (eg. 'RuleBgCasual')
   * @type {string}
   */
  this.name = '';

  /**
   * Short title describing rule specifics
   * @type {string}
   */
  this.title = '';

  /**
   * Full description of rule
   * @type {string}
   */
  this.description = '';

  /**
   * Full name of country where this rule (variant) is played.
   * To list multiple countries use a pipe ('|') character as separator.
   * @type {string}
   */
  this.country = '';

  /**
   * Two character ISO code of country where this rule (variant) is played.
   * To list multiple codes use a pipe ('|') character as separator.
   * List codes in same order as countries in the field above.
   * @type {string}
   */
  this.countryCode = '';

  // TODO: Make maxPoints a fixed constant. No need to be extensible, as all variants we are interested in are using 24 points.
  this.maxPoints = 24;

  /**
   * The number of pieces each player has
   * @type {number}
   */
  this.maxPieces = 15;

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

/**
 * Initialize state.
 * @memberOf Rule
 * @param {State} state - Board state to initialize
 */
Rule.prototype.initialize = function(state) {
  model.State.clear(state);

  // Create points
  state.points.length = 0;
  for (var i = 0; i < 24; i++) {
    var point = [];
    state.points.push(point);
  }
};

/**
 * Roll dice and generate list of moves the player has to make according to
 * current rules.
 *
 * Descendants rules would normally override this method in order to properly determine
 * the allowed move values that correspond to a specific die combination (eg. doubles).
 *
 * @memberOf Rule
 * @param {Game} game - Game object. Used to check if it is the first turn of the game.
 * @param {number[]} [values] - Optional parameter containing the dice values to use,
 *                              instead of generating random values. Used by some rules
 *                              as RuleBgGulbara.
 * @returns {Dice} - Dice object containing random values and allowed moves
 */
Rule.prototype.rollDice = function(game, values) {
  // Create dice object with 2 random values
  var dice = model.Dice.roll();

  if (typeof values !== "undefined") {
    dice.values[0] = values[0];
    dice.values[1] = values[1];
    dice.values[2] = values[2];
  }

  // Add those values to moves list - the individual moves the player has to make
  dice.moves = dice.moves.concat(dice.values);

  // Doubles & Triples?
  if (dice.values[0] == dice.values[1]) {
    dice.moves.push(dice.values[0]);
    dice.moves.push(dice.values[1]);
  }
  if (dice.values[1] == dice.values[2]) {
    dice.moves.push(dice.values[1]);
    dice.moves.push(dice.values[2]);
  }
  if (dice.values[0] == dice.values[2]) {
    dice.moves.push(dice.values[0]);
    dice.moves.push(dice.values[2]);
  }

  // Sort moves in descending order for convenience later in enforcing
  // move rules
  dice.moves.sort(function (a, b) { return b - a; });

  // TODO: Put in movesLeft only moves that are playable.
  var weight = this.calculateMoveWeights(game.state, dice.moves, game.turnPlayer.currentPieceType, null, true);
  dice.moves = weight.playableMoves;

  // Copy move values to movesLeft array. Moves will be removed from movesLeft
  // after being played by player, whereas values in moves array will remain
  // in case the player wants to undo his actions.
  dice.movesLeft = dice.movesLeft.concat(dice.moves);

  console.log('Playable moves:', weight.playableMoves);

  return dice;
};

/**
 * Reset state to initial position of pieces according to current rule.
 * @memberOf Rule
 * @abstract
 * @param {State} state - Board state
 */
Rule.prototype.resetState = function(state) {
  throw new Error("Abstract method!");
};

/**
 * Increment position by specified number of steps and return an incremented position
 * @memberOf Rule
 * @abstract
 * @param {number} position - Position
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {number} Incremented position (denormalized)
 */
Rule.prototype.incPos = function(position, type, steps) {
  throw new Error("Abstract method!");
};

/**
 * Normalize position - Normalized positions start from 0 to 23 for both players,
 * where 0 is the first position in the home part of the board, 6 is the last
 * position in the home part and 23 is the furthest position - in the opponent's
 * home.
 *
 * This is different in each rule.
 *
 * @memberOf Rule
 * @param {number} position - Denormalized position (0 to 23 for white and 23 to 0 for black)
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {number} - Normalized position (0 to 23 for both players)
 */
Rule.prototype.normPos = function(position, type) {
  throw new Error("Abstract method!");
};

/**
 * Get denormalized position.
 *
 * This is different in each rule.
 *
 * @memberOf Rule
 * @param {number} position - Normalized position (0 to 23 for both players)
 * @param {PieceType} type - Type of piece (white/black)
 * @return {number} - Denormalized position (0 to 23 for white and 23 to 0 for black)
 */
Rule.prototype.denormPos = function(position, type) {
  throw new Error("Abstract method!");
};

/**
 * Check if there are any pieces on the bar.
 * @memberOf Rule
 * @param {State} state - State to check
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {boolean} - True if there are any pieces on the bar
 */
Rule.prototype.havePiecesOnBar = function(state, type) {
  return state.bar[type].length > 0;
};

/**
 * Count pieces of specified type at higher positions
 * @memberOf Rule
 * @param {State} state - State to check
 * @param {number} position - Normalized position (inclusive)
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {number} - Number of pieces at positions higher than position
 */
Rule.prototype.countAtHigherPos = function(state, position, type) {
  var cnt = 0;

  for (var i = 23; i >= position; i--) {
    var denormPos = this.denormPos(i, type);

    cnt = cnt + model.State.countAtPos(state, denormPos, type);
  }

  return cnt;
};

/**
 * Check if all pieces are in the home field.
 * @memberOf Rule
 * @param {State} state - State to change
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {boolean} - True if all pieces are in home field
 */
Rule.prototype.allPiecesAreHome = function(state, type) {
  return this.countAtHigherPos(state, 6, type) <= 0;
};

/**
 * Validate player's turn.
 *
 * This is the base method for validation of moves that make a few general
 * checks like:
 * - Is the game started and is finished?
 * - Is it player's turn?
 *
 * @memberOf Rule
 * @param {Game} game - Game
 * @param {Player} player - Player
 * @returns {boolean} True if move is valid and should be allowed.
 */
Rule.prototype.validateTurn = function(game, player) {
  if (!game.hasStarted) {
    console.log('Game with ID ' + game.id + ' is not yet started!');
    return false;
  }

  if (game.isOver) {
    console.log('Game with ID ' + game.id + ' is over!');
    return false;
  }

  if (!model.Game.isTypeTurn(game, player.currentPieceType)) {
    console.log('Cannot move piece, it isn\'t player ' + player.currentPieceType + ' turn!');
    return false;
  }

  return true;
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
 * @memberOf Rule
 * @param {Game} game - Game
 * @param {Player} player - Player requesting move
 * @param {Piece} piece - Piece to move
 * @param {number} steps - Number of steps to make forward to the first home position
 * @returns {boolean} True if move is valid and should be allowed.
 */
Rule.prototype.validateMove = function(game, player, piece, steps) {
  if (!this.validateTurn(game, player)) {
    return false;
  }

  if (!model.Game.diceWasRolled(game)) {
    console.log('Dice was not rolled!');
    return false;
  }

  if (!model.Game.hasMove(game, steps)) {
    console.log('No such move left!');
    return false;
  }

  if (piece.type !== player.currentPieceType) {
    console.log('Piece is of wrong type!');
    return false;
  }

  if (this.isMoveActionRestricted(game.state, game.turnDice.movesLeft, piece, steps, model.MoveActionType.MOVE)) {
    return false;
  }

  return true;
};

/**
 * Validate confirmation of moves.
 *
 * This is the base method for validation of moves that make a few general
 * checks like:
 * - Is the game started and is finished?
 * - Is it player's turn?
 * - Was dice rolled?
 * - Are all moves played?
 * - Not confirmed already?
 *
 * Descendant rules must extend this method and add additional validation checks
 * according to the rule specifics.
 *
 * @memberOf Rule
 * @param {Game} game - Game
 * @param {Player} player - Player
 * @returns {boolean} True if confirmation is allowed
 */
Rule.prototype.validateConfirm = function(game, player) {
  if (!this.validateTurn(game, player)) {
    return false;
  }

  if (!model.Game.diceWasRolled(game)) {
    console.log('Dice was not rolled!');
    return false;
  }

  if (model.Game.hasMoreMoves(game)) {
    console.log('Not all moves have been played!');
    return false;
  }

  if (game.turnConfirmed) {
    console.log('Moves have already been confirmed!');
    return false;
  }

  return true;
};

/**
 * Validate request for undoing moves.
 *
 * This is the base method for validation of undo that make a few general
 * checks like:
 * - Is the game started and is finished?
 * - Is it player's turn?
 * - Was dice rolled?
 * - Are all moves played?
 * - Not confirmed already?
 *
 * Descendant rules can extend this method and add additional validation checks
 * according to the rule specifics.
 *
 * @memberOf Rule
 * @param {Game} game - Game
 * @param {Player} player - Player
 * @returns {boolean} True if confirmation is allowed
 */
Rule.prototype.validateUndo = function(game, player) {
  if (!this.validateTurn(game, player)) {
    return false;
  }

  if (!model.Game.diceWasRolled(game)) {
    console.log('Dice was not rolled!');
    return false;
  }

  if (game.turnConfirmed) {
    console.log('Moves have already been confirmed!');
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
Rule.prototype.calculateMoveWeights = function(state, movesLeft, pieceType, rootPiece, stopAtMax, moveType) {
  var weight = {};
  weight.max = 0;
  weight.playableMoves = [];

  var self = this;

  var movesLeftSum = 0;
  for (var i = 0; i < movesLeft.length; i++) {
    movesLeftSum += movesLeft[i];
  }

  // TODO: Replace recursion with linear loop over a queue
  //       Don't check moves twice (eg. 5:2 and 2:5 for the same pieces)

  function calculateBranchWeights(st, moves, id, branchSum, level, branchMoves, moveType) {
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
      if (stopAtMax) {
        // If a branch that allows the player to use all moves
        // has been found, do not iterate other branches
        if (weight.max >= movesLeftSum) {
          console.log('Stop permutations. A branch was found that allows all moves to be played');
          return true;
        }
      }
      return false;
    }

    // create a new State where we apply these actions
    function applyTempActions (actions,tempState,id,branchSum,shouldStop,calculateBranchWeights,level,moveType) {
      // If yes, apply the move action to the temporary state.
      console.log('Applying actions', actions);
      self.applyMoveActions(tempState, actions);

      var tempMoves = branchMoves.slice();
      tempMoves.push(steps);

      // If we are still at level 0, create a new branch
      var pieceID = (id !== 0) ? id: piece.id;
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

      if (w > weight.max) {
        weight.max = w;
        weight.playableMoves = tempMoves;
      }

      if (shouldStop()) {
        return;
      }

      if (movesLeft.length > 0) {
        calculateBranchWeights(tempState, movesLeft, pieceID, w, level + 1, tempMoves, moveType);
      }
    }

    /** Local copy of moves left */
    var movesLeft = moves.slice();

    // Get steps (value) for next move
    var steps = movesLeft.shift();
    if (!steps) {
      return;
    }

    //console.log('Piece type:', pieceType);
    console.log(Array(level + 2).join("-") + ' Begin consider move with die=' + steps);

    // Iterate all of player's pieces
    for (var p = 0; p < st.pieces[pieceType].length; p++) {
          var piece = st.pieces[pieceType][p];
          if ((!piece) || (piece.type !== pieceType)) {
            continue;
          }

          // If a root piece has been specified, check
          // only the branches that start at this piece.
          // Ignore other branches
          if (level === 0 && rootPiece) {
            if (rootPiece.id !== piece.id) {
              continue;
            }
          }

          // Do not check pieces that are already outside the board
          if (model.State.isPieceOutside(st, piece)) {
            continue;
          }

          console.log('Considering moving Piece ID', piece.id);
          // console.log('Outside', st.outside);
          // if (piece.id === 5) {
          //   console.log('TEN');
          //   console.log(piece.type);
          //   console.log(st.outside[0].length);
          //   console.log(st.outside[0]);
          //   console.log(st.outside);
          //   console.log(pieceType);
          // }

          // Check if the player has any pieces on bar. If that is the
          // case only pieces on the bar can be moved
          if (model.State.havePiecesOnBar(st, pieceType)) {
            // Player can only move the top piece on the bar.
            // If there are more pieces on the bar they could be moved on next
            // move, but not on this one
            if (model.State.getBarTopPiece(st, pieceType).id !== piece.id) {
              continue;
            }
            //console.log('Bar');
          }
          else {
            // If there are no pieces on the bar, make sure this piece is the
            // top piece at its position. Only top pieces can be moved
            var pos = model.State.getPiecePos(st, piece);
            if (model.State.getTopPiece(st, pos).id !== piece.id) {
              continue;
            }
            //console.log('Pos', pos);
          }

          // Make a deep copy of the state. Moves will be applied to the copy. The
          // copy will be passed one level down - to the move (next node of the branch).
          var tempState = model.Utils.deepCopy(st);

          // Check if current piece can be moved either UP or MOVE
          var moveActions = self.getMoveActions(tempState, piece, steps, model.MoveActionType.MOVE);

          // If the piece can be moved
          //console.log('Piece ID', piece.id);
          if (moveActions.length === 0) {
            console.log('No MOVE actions for this piece');
          }
          else {
            applyTempActions(moveActions,tempState,id,branchSum,shouldStop,calculateBranchWeights,level,model.MoveActionType.MOVE);
          }
          var upActions = self.getMoveActions(tempState, piece, steps, model.MoveActionType.UP);
          if (upActions.length === 0) {
            console.log('No UP actions for this piece');
          }
          else {
            applyTempActions(upActions,tempState,id,branchSum,shouldStop,calculateBranchWeights,level,model.MoveActionType.UP);
          }
    }

    console.log(Array(level + 2).join("-") + ' End consider move ' + steps);
  }

  console.time('Recursion time');

  // Simulate moving the piece with all dice values, starting from highest die value
  // (eg. for dice 5:3 try moving 5 first and after that 3). Try this for all pieces
  // (multiple branches)
  console.log('moves 1:', movesLeft);
  calculateBranchWeights(state, movesLeft, 0, 0, 0, [], moveType);
  console.log('Intermediate weight:', weight);

  // Then try playing from lowest die value first
  // (eg. for dice 5:3 try moving 3 first and after that 5). Also try this for all pieces
  // (more branches)
  // No need to do that for pair values (eg. 5:5)
  if ((movesLeft.length > 1) && (movesLeft[0] != movesLeft[movesLeft.length - 1])) {
    movesLeft = movesLeft.slice();
    movesLeft.reverse();
    console.log('moves2:', movesLeft);
    calculateBranchWeights(state, movesLeft, 0, 0, 0, [], moveType);
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
 * @memberOf Rule
 * @param {State} state - State
 * @param {number[]} movesLeft - Move values left
 * @param {Piece} piece - Piece to move
 * @param {number} steps - Number of steps to move
 * @returns {boolean} - Returns true if move is restricted (not allowed).
 */
Rule.prototype.isMoveActionRestricted = function(state, movesLeft, piece, steps, moveType) {
  // 1. Try out all possible moves (for all of player's pieces).
  // 2. Sum the move values for all resulting branches with possible moves.
  // 3. Check if the move request of the player can be used in a branch that allows
  //    all move values to be used.
  // 4. If there are no better branches than the one chosen by the player, allow the
  //    move

  var weight = this.calculateMoveWeights(state, movesLeft, piece.type, piece, false, moveType);
  var maxWeight = weight.max;

  if ((!weight[piece.id]) || (weight[piece.id].max < maxWeight)) {
    console.log('There is better move. Piece weight:', weight[piece.id]);
    return true;
  }

  return false;
};

/**
 * Call this method after a request for moving a piece has been made.
 * Determines if the move is allowed and what actions will have to be made as
 * a result. Actions can be `move`, `hit`, `recover` or `bear`.
 *
 * If move is allowed or not depends on the current state of the game. For example,
 * if the player has pieces on the bar, they will only be allowed to recover pieces.
 *
 * Multiple actions can be returned, if required. Placing (or moving) a piece over
 * an opponent's blot will result in two actions: `hit` first, then `recover` (or `move`).
 *
 * The list of actions returned would usually be appllied to game state and then
 * sent to client. The client's UI would play the actions (eg. with movement animation)
 * in the same order.
 *
 * @memberOf Rule
 * @abstract
 * @param {State} state - State to change
 * @param {Piece} piece - Piece to move
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {MoveAction[]} - List of actions if move is allowed, empty list otherwise.
 * @see {@link RuleBgCasual.getMoveActions} for an example on how to implement this method
 */
Rule.prototype.getMoveActions = function(state, piece, steps, moveType) {
  throw new Error("Abstract method!");
};

/**
 * Call this method to apply a list of actions to a game state.
 * Actions depend on rule and usually are `move`, `hit`, `recover` or `bear`.
 *
 * @memberOf Rule
 * @param {State} state - State to change
 * @param {MoveAction[]} actionList - List of action to apply.
 */
Rule.prototype.applyMoveActions = function(state, actionList) {
  for (var i = 0; i < actionList.length; i++) {
    var action = actionList[i];

    if (!model.Utils.includes(this.allowedActions, action.type)) {
      return;
    }

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
    else if (action.type === model.MoveActionType.UP) {
      this.up(state, action.piece, action.to);
    }
  }
};

/**
 * Place one or more pieces from player set to board point.
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {number} number - Number of pieces to place
 * @param {PieceType} type - Type of pieces to place
 * @param {number} position - Position at which to place piece(s)
 */
Rule.prototype.place = function (state, number, type, position) {
  for (var i = 0; i < number; i++) {
    var piece = new model.Piece(type, state.nextPieceID);
    state.pieces[type].push(piece);
    state.points[position].push(piece);
    state.heightOverrides[state.nextPieceID] = 0;
    state.nextPieceID++;
  }
};

/**
 * Move piece to specified point, without enforcing any rules or performing any validation.
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {Piece} piece - Piece to move
 * @param {number} toPos - Position to which to move the piece to
 * @throws Throws an error if there is no piece at fromPos or piece is of wrong type
 */
Rule.prototype.move = function(state, piece, toPos) {
  // Find the current position of the piece
  var fromPos = model.State.getPiecePos(state, piece);

  var topPiece = state.points[fromPos].pop();
  if (!topPiece) {
    throw new Error("No piece found at position " + parseInt(fromPos) +  " !");
  }

  if (topPiece.id !== piece.id) {
    state.points[fromPos].push(topPiece);
    console.log(fromPos, toPos, topPiece);
    throw new Error("The top piece at position " + fromPos + " is different than the one the player wants to move!");
  }

  state.points[toPos].push(topPiece);
};

/**
 * Bear piece - remove from board and place outside
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {Piece} piece - Piece to bear
 * @throws Throws an error if there is no piece at fromPos or piece is of wrong type
 */
Rule.prototype.bear = function (state, piece) {
  // Find the current position of the piece
  var fromPos = model.State.getPiecePos(state, piece);

  var topPiece = state.points[fromPos].pop();
  if (!topPiece) {
    throw new Error("No piece found at position " + parseInt(fromPos) +  " !");
  }

  if (topPiece.id !== piece.id) {
    state.points[fromPos].push(topPiece);
    console.log(fromPos, topPiece);
    throw new Error("The top piece at position " + fromPos + " is different than the one the player wants to move!");
  }

  state.outside[piece.type].push(topPiece);
};

/**
 * UP piece - remove from board and place outside
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {Piece} piece - Piece to move UP
 * @param {int} steps - How high to move up
 * @throws Throws an error if there is no piece at fromPos or piece is of wrong type
 */
Rule.prototype.up = function (state, piece, steps) {
  // Find the current position of the piece
  var fromPos = model.State.getPiecePos(state, piece);

  var topPiece = state.points[fromPos].pop();
  if (!topPiece) {
    throw new Error("No piece found at position " + parseInt(fromPos) +  " !");
  }
  // put it back because it'll remain on this point
  state.points[fromPos].push(topPiece);

  if (topPiece.id !== piece.id) {
    console.log(fromPos, topPiece);
    throw new Error("The top piece at position " + fromPos + " is different than the one the player wants to move!");
  }

  // set the HEIGHT appropriately
  // TODO(risher): move this into the Piece itself
  if (state.heightOverrides[piece] === undefined)
    state.heightOverrides[piece] = 0;
  state.heightOverrides[piece] += steps;
  if (piece.heightBoost === undefined)
    piece.heightBoost = 0;
  piece.heightBoost += steps;

};

/**
 * Hit piece - send piece to bar
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {Piece} piece - Piece to hit
 * @throws Throws an error if there is no piece at fromPos or piece is of wrong type
 */
Rule.prototype.hit = function (state, piece) {
  // Find the current position of the piece
  var fromPos = model.State.getPiecePos(state, piece);

  var topPiece = state.points[fromPos].pop();
  if (!topPiece) {
    throw new Error("No piece found at position " + parseInt(fromPos) +  " !");
  }

  if (topPiece.id !== piece.id) {
    state.points[fromPos].push(topPiece);
    console.log(fromPos, topPiece);
    throw new Error("The top piece at position " + fromPos + " is different than the one the player wants to move!");
  }

  state.bar[piece.type].push(topPiece);
};

/**
 * Recover piece - place from bar to board
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {Piece} piece - Piece to recover
 * @param {number} position - Position to  which to place the piece
 * @throws Throws an error if there is no piece at fromPos or piece is of wrong type
 */
Rule.prototype.recover = function (state, piece, position) {
  var topPiece = state.bar[piece.type].pop();
  if (!topPiece) {
    throw new Error("No piece found at bar!");
  }

  if (topPiece.id !== piece.id) {
    state.bar[piece.type].push(topPiece);
    throw new Error("The top piece at bar is different than the one the player wants to move!");
  }

  state.points[position].push(topPiece);
};

/**
 * Mark move as played
 * @memberOf Rule
 * @param {Game} game - Game
 * @param {number} move - Move (number of steps)
 */
Rule.prototype.markAsPlayed = function (game, move) {
  model.Dice.markAsPlayed(game.turnDice, move);
};

/**
 * Check game state and determine if the specified player has won the game.
 * This method assumes that the specified player was on turn and has played
 * and confirmed his move.
 *
 * @memberOf Rule
 * @param {State} state - Game state
 * @param {Player} player - Player
 * @returns {boolean} - True if player has won the game
 */
Rule.prototype.hasWon = function (state, player) {
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
 * @memberOf Rule
 * @param {State} state - Game state
 * @param {Player} player - Player
 * @returns {boolean} - True if player has won the game
 */
Rule.prototype.getGameScore = function (state, player) {
  var oppType = (player.currentPieceType === model.PieceType.WHITE) ?
    model.PieceType.BLACK
    :
    model.PieceType.WHITE;

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
 * Proceed to next turn.
 *
 * Start next turn:
 * 1. Reset turn
 * 2. Change players
 * 3. Roll new dice
 *
 * @memberOf Rule
 * @param {Match} match - Match
 */
Rule.prototype.nextTurn = function (match) {
  var game = match.currentGame;
  game.turnConfirmed = false;
  game.turnDice = null;
  game.turnPlayer = (game.turnPlayer.id == match.host.id) ? match.guest : match.host;
  game.turnNumber += 1;
};

module.exports = Rule;
