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
   * Denotes direction of piece movement for white player, relative to initial position.
   * @type {Direction}
   * @see {Direction}
   */
  this.whiteDirection = model.Direction.LEFT;

  /**
   * Denotes direction of piece movement for black player, relative to initial position.
   * @type {Direction}
   * @see {Direction}
   */
  this.blackDirection = model.Direction.RIGHT;

  // TODO: Remove these fields?
  // Most distant position of player with any pieces on it
  //this.whiteStart = 0;
  //this.blackStart = 0;
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
 * @returns {Dice} - Dice object containing random values and allowed moves
 */
Rule.prototype.rollDice = function() {
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

  dice.movesLeft = dice.movesLeft.concat(dice.moves);

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
 * @param {number} position - Denormalized position
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {number} Incremented position (denormalized)
 */
Rule.prototype.incPos = function(position, type, steps) {
  throw new Error("Abstract method!");
};

/**
 * Check if there are any pieces on the bar.
 * @memberOf Rule
 * @param {Game} game - Check state of the specified game
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {boolean} - True if there are any pieces on the bar
 */
Rule.prototype.havePiecesOnBar = function(game, type) {
  return game.state.bar[type].length > 0;
};

/**
 * Count pieces of specified type at higher positions
 * @memberOf Rule
 * @param {Game} game - Check state of the specified game
 * @param {number} position - Normalized position
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {number} - Number of pieces at positions higher than position
 */
Rule.prototype.countAtHigherPos = function(game, position, type) {
  var cnt = 0;

  for (var i = 23; i >= position; i--) {
    var denormPos = this.denormPos(i, type);

    cnt = cnt + model.State.countAtPos(game.state, denormPos, type);
  }

  return cnt;
};

/**
 * Check if all pieces are in the home field.
 * @memberOf Rule
 * @param {Game} game - Check state of the specified game
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {boolean} - True if all pieces are in home field
 */
Rule.prototype.allPiecesAreHome = function(game, type) {
  return this.countAtHigherPos(game, 6, type) <= 0;
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
 * @param {Game} game - Game
 * @param {number} position - Denormalized position
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {MoveAction[]} - List of actions if move is allowed, empty list otherwise.
 * @see {@link RuleBgCasual.getMoveActions} for an example on how to implement this method
 */
Rule.prototype.getMoveActions = function(game, position, type, steps) {
  throw new Error("Abstract method!");
}

/**
 * Call this method to apply a list of actions to a game state.
 * Actions depend on rule and usually are `move`, `hit`, `recover` or `bear`.
 *
 * @memberOf Rule
 * @abstract
 * @param {Game} game - Game, which state to change
 * @param {MoveAction[]} actionList - List of action to apply.
 */
Rule.prototype.applyMoveActions = function(game, actionList) {
  throw new Error("Abstract method!");
}

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
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {boolean} True if move is valid and should be allowed.
 */
Rule.prototype.validateTurn = function(game, type) {
  if (!game.hasStarted) {
    console.log('Game with ID ' + game.id + ' is not yet started!');
    return false;
  }

  if (game.isOver) {
    console.log('Game with ID ' + game.id + ' is over!');
    return false;
  }

  if (!model.Game.isTypeTurn(game, type)) {
    console.log('Cannot move piece, it isn\'t type ' + type + ' turn!');
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
 * @param {number} position - Denormalized position of point
 * @param {PieceType} type - Type of piece (white/black)
 * @param {number} steps - Number of steps to make forward to the first home position
 * @returns {boolean} True if move is valid and should be allowed.
 */
Rule.prototype.validateMove = function(game, position, type, steps) {
  if (!this.validateTurn(game, type)) {
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
 * @param {PieceType} type - Type of piece (white/black)
 * @returns {boolean} True if confirmation is allowed
 */
Rule.prototype.validateConfirm = function(game, type) {
  if (!this.validateTurn(game, type)) {
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
    state.nextPieceID++;
  }
};

/**
 * Move piece to specified point, without enforcing any rules or performing any validation.
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {number} fromPos - Position from which to take the piece
 * @param {number} toPos - Position to which to move the piece to
 * @param {PieceType} type - Type of piece (white/black) that will be moved
 * @throws Throws an error if there is no piece at fromPos or piece is of wrong type
 */
Rule.prototype.move = function(state, fromPos, toPos, type) {
  // TODO: Check piece type
  var piece = state.points[fromPos].pop();
  if ((!piece) || (piece == null)) {
    throw new Error("No piece found at position " + parseInt(fromPos) +  " !");
  }

  if (piece.type !== type) {
    state.points[fromPos].push(piece);
    console.log(fromPos, toPos, piece);
    throw new Error("Piece (" + parseInt(piece.type) + ") is not of expected type (" + parseInt(type) + ")!");
  }

  state.points[toPos].push(piece);
};

/**
 * Bear piece - remove from board and place outside
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {number} position - Position from which to take the piece
 * @param {PieceType} type - Type of piece (white/black) that will be borne
 * @throws Throws an error if there is no piece at fromPos or piece is of wrong type
 */
Rule.prototype.bear = function (state, position, type) {
  var piece = state.points[position].pop();
  if ((!piece) || (piece == null)) {
    throw new Error("No piece found at position " + parseInt(position) +  " !");
  }

  if (piece.type !== type) {
    state.points[position].push(piece);
    throw new Error("Piece is not of expected type!");
  }

  state.outside[type].push(piece);
};

/**
 * Hit piece - send piece to bar
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {number} position - Position from which to take the piece
 * @param {PieceType} type - Type of piece (white/black) that is being hit
 * @throws Throws an error if there is no piece at fromPos or piece is of wrong type
 */
Rule.prototype.hit = function (state, position, type) {
  var piece = state.points[position].pop();
  if ((!piece) || (piece == null)) {
    throw new Error("No piece found at position " + parseInt(position) +  " !");
  }

  if (piece.type !== type) {
    state.points[position].push(piece);
    throw new Error("Piece is not of expected type!");
  }

  state.bar[type].push(piece);
};

/**
 * Recover piece - place from bar to board
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {number} position - Position to  which to place the piece
 * @param {PieceType} type - Type of piece (white/black) that is being recovered
 * @throws Throws an error if there is no piece at fromPos or piece is of wrong type
 */
Rule.prototype.recover = function (state, position, type) {
  var piece = state.bar[type].pop();
  if ((!piece) || (piece == null)) {
    throw new Error("No piece found at bar!");
  }

  if (piece.type !== type) {
    state.bar[type].push(piece);
    throw new Error("Piece is not of expected type!");
  }

  state.points[position].push(piece);
};

/**
 * Move piece by specified number of steps without enforcing any rules.
 * @memberOf Rule
 * @abstract
 * @param {Game} game - Game
 * @param {number} position - Denormalized position
 * @param {PieceType} type - Type of piece
 * @param {number} steps - Number of steps to increment towards first home position
 * @returns {boolean} - True if piece was moved/borne/recovered
 */
Rule.prototype.moveBy = function(game, position, type, steps) {
  throw new Error("Abstract method!");
};

/**
 * Mark move as played
 * @memberOf Rule
 * @abstract
 * @param {Game} game - Game
 * @param {number} move - Move (number of steps)
 * @returns {boolean} - True if piece was moved/borne/recovered
 */
Rule.prototype.markAsPlayed = function(game, move) {
  model.Dice.markAsPlayed(game.turnDice, move);
};

module.exports = Rule;
