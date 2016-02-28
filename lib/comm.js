var Protocol = {
  'Port': 3000
};
module.exports.Protocol = Protocol;

var Message = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  GET_MESSAGE_LIST: 'getMessageList',
  GET_GAME_LIST: 'getGameList',
  CREATE_GAME_LIST: 'createGame',
  JOIN_GAME_LIST: 'joinGame',
  ROLL_DICE: 'rollDice',
  REQUEST_MOVE: 'requestMove'
};
module.exports.Message = Message;
