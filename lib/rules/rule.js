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

  // TODO: Make maxPoints a fixed constant. No need to be extensible, as all variants we are interested about are using 24 points.
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
  for (var i = 0; i < this.maxPoints; i++) {
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
  dice.moves.push(dice.values);

  // Dices with equal values are played four times, so add two more moves
  if (dice.moves[0] == dice.moves[1]) {
    dice.moves.push(dice.values);
  }

  // Sort moves in descending order for convenience later in enforcing
  // move rules
  dice.moves.sort(function(a, b){return b-a});

  dice.movesLeft.push(dice.moves);

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
 * @params {number} position - Denormalized position
 * @params {PieceType} type - Type of piece
 * @params {number} steps - Number of steps to increment towards first home position
 * @returns {number} Incremented position (denormalized)
 */
Rule.prototype.incPos = function(position, type, steps) {
  throw new Error("Abstract method!");
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
 * @returns {boolean} - True if piece was moved
 */
Rule.prototype.move = function(state, fromPos, toPos) {
  // TODO: Check piece type
  var piece = state.points[fromPos].pop();
  if (piece != null) {
    state.points[toPos].push(piece);
    return true;
  }

  // TODO: Use exception instead of returning boolean
  return false;
};

/**
 * Bear piece - remove from board and place outside
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {number} position - Position from which to take the piece
 * @param {PieceType} type - Type of piece (white/black) that will be borne
 * @returns {boolean} - True if piece was borne
 */
Rule.prototype.bear = function (state, position, type) {
  var piece = state.points[position].pop();
  if (piece != null) {
    if (piece.PieceType === type) {
      state.outside[type].push(piece);
      return true;
    }

    state.points[position].push(piece);
  }

  // TODO: Use exception instead of returning boolean
  return false;
};

/**
 * Hit piece - send piece to bar
 * @memberOf Rule
 * @param {State} state - Board state
 * @param {number} position - Position from which to take the piece
 * @param {PieceType} type - Type of piece (white/black) that is being hit
 * @returns {boolean} - True if piece was hit
 */
Rule.prototype.hit = function (state, position, type) {
  var piece = state.points[position].pop();
  if (piece != null) {
    if (piece.PieceType === type) {
      state.bar[type].push(piece);
      return true;
    }

    state.points[position].push(piece);
  }

  // TODO: Use exception instead of returning boolean
  return false;
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
  if (!game.hasStarted) {
    console.log('Game with ID ' + game.id + ' is not yet started!');
    return false;
  }

  if (game.isOver) {
    console.log('Game with ID ' + game.id + ' is over!');
    return false;
  }

  if (!model.Game.isPlayerTurn(game, player)) {
    console.log('Cannot move piece, it isn\'t player ' + player.id + ' turn!');
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

module.exports = Rule;
