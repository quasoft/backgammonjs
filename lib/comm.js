var Protocol = {
  'Port': 3000
};
module.exports.Protocol = Protocol;

var Message = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CREATE_GUEST: 'createGuest',
  GET_MESSAGE_LIST: 'getMessageList',
  GET_GAME_LIST: 'getGameList',
  CREATE_GAME: 'createGame',
  JOIN_GAME: 'joinGame',
  START_GAME: 'startGame',
  ROLL_DICE: 'rollDice',
  MOVE_PIECE: 'movePiece',
  CONFIRM_MOVES: 'confirmMoves',
  EVENT_PLAYER_JOINED: 'eventPlayerJoined',
  EVENT_TURN_START: 'eventTurnStart'
};

module.exports.Message = Message;
