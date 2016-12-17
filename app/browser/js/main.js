var $ = require('jquery');
var fittext = require('jquery-fittext');
var cookie = require('js-cookie');
// TODO: Fix this hack. Makes bootstrap happy, but this should not be needed.
window.jQuery = window.$ = $;

var bootstrap = require('bootstrap');
var clipboard = require('clipboard');
var cl = require('../../../lib/client');
var comm = require('../../../lib/comm.js');
var model = require('../../../lib/model.js');
require('../../../lib/rules/rule.js');
require('../../../lib/rules/RuleBgCasual.js');
require('../../../lib/rules/RuleBgGulbara.js');

function App() {
  this._config = {};
  this._isWaiting = false;
  this._currentView = 'index';
  
  this.setIsWaiting = function (value) {
    this._isWaiting = value;
  }
  
  this.setCurrentView = function (name) {
    this._currentView = name;
  }
  
  this.updateView = function () {
    if (this._isWaiting) {
      $('#waiting-overlay').show();
    } else {
      $('#waiting-overlay').hide();
    }

    $('#game-view').hide();
    $('#index-view').hide();
    $('#github-ribbon').hide();
    if (this._currentView == 'index') {
      $('#index-view').show();
      $('#github-ribbon').show();
    }
    else if (this._currentView == 'game') {
      $('#game-view').show();
    }
  }
  
  /**
   * Get name of rule selected by player
   * @returns {string} - Name of selected rule.
   */
  this.getSelectedRuleName = function () {
    var selected = $('#rule-selector label.active input').val();
    return selected;
  };
  
  /**
   * Load rule module
   * @param {string} ruleName - Rule's name, equal to rule's class name (eg. RuleBgCasual)
   * @returns {Rule} - Corresponding rule object
   */
  this.loadRule = function (rulePath, ruleName) {
    var fileName = model.Utils.sanitizeName(ruleName);
    var file = rulePath + fileName + '.js';
    var rule = require(file);
    rule.name = fileName;
    return rule;
  };
  
  /**
   * Initialize selector of game rule
   */
  this.initRuleSelector = function () {
    // Init rule selector
    selector = $('#rule-selector');
    var i;
    for (i = 0; i < this._config.selectableRules.length; i++) {
      var ruleName = this._config.selectableRules[i];
      var rule = app.loadRule('../../../lib/rules/', ruleName);
      var isSelected = false;
      var isActive = isSelected ? 'active' : '';
      var isChecked = isSelected ? 'checked' : '';

      var item = $('#tmpl-rule-selector-item').html();
      item = item.replace('{{name}}', rule.name);
      item = item.replace('{{title}}', rule.title);
      item = item.replace('{{active}}', isActive);
      item = item.replace('{{checked}}', isChecked);

      selector.append($(item));
    }
  };
  
  /**
   * Initialize application. Must be called after DOM is ready.
   * @param {Object} config - Configuration object
   */
  this.init = function (config) {
    var self = this;
    this._config = config;
    
    this.initRuleSelector();
    
    // Initialize the overlay showing game results
    $('#game-result-overlay').click(function () {
      $('#game-result-overlay').hide();
    });

    // Initialize game client
    var client = new cl.Client(config);

    // Subscribe to events used on landing page
    client.subscribe(comm.Message.EVENT_MATCH_START, function (msg, params) {
      self.setIsWaiting(false);
      self.setCurrentView('game');
      self.updateView();
      client.resizeUI();
    });

    client.subscribe(comm.Message.EVENT_MATCH_OVER, function (msg, params) {
      self.setIsWaiting(false);
      self.setCurrentView('index');
      self.updateView();
    });

    $('#btn-create-match').click(function (e) {
      client.reqCreateMatch(config.defaultRule);
    });

    $('#btn-join-match').click(function (e) {
      client.reqJoinMatch(null);
    });

    $('#btn-play-random').click(function (e) {
      self.setIsWaiting(true);
      self.updateView();
      // TODO: Store selected rule in cookie
      client.reqPlayRandom(self.getSelectedRuleName());
    });

    $(window).resize(function () {
      client.resizeUI();
    });
  };
};

var app = new App();

$(document).ready(function() {
  // Initialize bootstrap and helpers
  new clipboard('.btn-copy');

  // Prepare client config
  var config = require('./config');
  
  app.init(config);
});