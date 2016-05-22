var $ = require('jquery');
//require('socket.io-client');
//require('../../../lib/comm.js');
//require('../../../lib/model.js');
//require('../../../lib/rules/rule.js');
//require('../../../lib/rules/bg-casual.js');
//require('../../../lib/rules/bg-gul-bara.js');
var client = require('../../../lib/client');

$(document).ready(function() {
  console.log('doc is ready');

  var config = {
    'containerID': 'backgammon',
    'boardUI': '../app/browser/js/SimpleBoardUI.js'
    //'boardUI': 'SimpleBoardUI'
  };

  var cl = new client.Client(config);

  $('#btn-create-game').click(function (e) {
    cl.reqCreateGame('RuleBgCasual');
  });

  $('#btn-join-game').click(function (e) {
    cl.reqJoinGame(null);
  });


});
