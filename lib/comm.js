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
  GET_MATCH_LIST: 'getMatchList',
  PLAY_RANDOM: 'playRandom',
  CREATE_MATCH: 'createMatch',
  JOIN_MATCH: 'joinMatch',
  START_GAME: 'startGame',
  ROLL_DICE: 'rollDice',
  MOVE_PIECE: 'movePiece',
  CONFIRM_MOVES: 'confirmMoves',
  EVENT_GAME_START: 'eventGameStart',
  EVENT_PLAYER_JOINED: 'eventPlayerJoined',
  EVENT_TURN_START: 'eventTurnStart',
  EVENT_DICE_ROLL: 'eventDiceRoll',
  EVENT_PIECE_MOVE: 'eventPieceMove',
  EVENT_RANDOM_MATCH_START: 'eventRandomMatchStart',
  EVENT_MATCH_OVER: 'eventMatchOver',
  EVENT_GAME_OVER: 'eventGameOver',
  EVENT_GAME_RESTART: 'eventGameRestart'
};

module.exports.Message = Message;
