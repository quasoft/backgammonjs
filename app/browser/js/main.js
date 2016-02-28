var $ = require('jquery');

//require('socket.io-client');
//require('../../../lib/comm.js');
//require('../../../lib/model.js');
//require('../../../lib/rules/rule.js');
//require('../../../lib/rules/bg-casual.js');
//require('../../../lib/rules/bg-gul-bara.js');
//require('simplegui');
var client = require('../../../lib/client');

$(document).ready(function() {
  console.log('doc is ready');

  var config = {
    'containerID': 'backgammon',
    'guiPath': '../app/browser/js/simplegui.js'
  };

  var cl = new client.Client(config);

  $('#btn-create-game').click(function (e) {
    var game = cl.createGame('./rules/bg-casual.js');
  });

  $('#btn-join-game').click(function (e) {
    var game = cl.joinGame(null);
  });
});
