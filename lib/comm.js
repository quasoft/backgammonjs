/**
 * Protocol options
 * @type {{Port: number}}
 */
var Protocol = {
  'Port': 3000
};
module.exports.Protocol = Protocol;

/**
 * Message IDs
 * @readonly
 * @enum {string}
 */
var Message = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CREATE_GUEST: 'createGuest',
  GET_GAME_LIST: 'getGameList',
  PLAY_RANDOM: 'playRandom',  
  CREATE_GAME: 'createGame',
  JOIN_GAME: 'joinGame',
  START_GAME: 'startGame',
  ROLL_DICE: 'rollDice',
  MOVE_PIECE: 'movePiece',
  CONFIRM_MOVES: 'confirmMoves',
  EVENT_GAME_START: 'eventGameStart',
  EVENT_PLAYER_JOINED: 'eventPlayerJoined',
  EVENT_TURN_START: 'eventTurnStart',
  EVENT_DICE_ROLL: 'eventDiceRoll',
  EVENT_PIECE_MOVE: 'eventPieceMove',
  EVENT_RANDOM_GAME_START: 'eventRandomGameStart'
};

module.exports.Message = Message;
