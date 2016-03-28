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
  ROLL_DICE: 'rollDice',
  MOVE_PIECE: 'movePiece'
};

module.exports.Message = Message;
