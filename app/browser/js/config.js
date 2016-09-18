var config = {};

config.containerID = 'backgammon';
config.boardUI = '../app/browser/js/SimpleBoardUI.js';
config.serverURL = 'http://' + window.location.host // eg. http://localhost:80', if testing locally

module.exports = config;