var config = {};

config.containerID = 'backgammon';
config.boardUI = '../app/browser/js/SimpleBoardUI.js';
config.defaultRule = 'RuleBgCasual';
config.selectableRules = [
  'RuleBgCasual',
  'RuleBgGulbara',
  'RuleBgTapa'
];

module.exports = config;