var $ = require('jquery');
var fittext = require('jquery-fittext');
var cookie = require('js-cookie');
// TODO: Fix this hack. Makes bootstrap happy, but this should not be needed.
window.jQuery = window.$ = $;

var bootstrap = require('bootstrap');
var clipboard = require('clipboard');
var cl = require('../../../lib/client');
var comm = require('../../../lib/comm.js');

function App() {
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
}

var app = new App();

$(document).ready(function() {
  // Initialize bootstrap and helpers
  new clipboard('.btn-copy');

  // Prepare client config
  var config = require('./config');
  
  // Initialize the overlay showing game results
  $('#game-result-overlay').click(function () {
    $('#game-result-overlay').hide();
  });
  
  // Initialize game client
  var client = new cl.Client(config);
  
  // Subscribe to events used on landing page
  client.subscribe(comm.Message.EVENT_MATCH_START, function (msg, params) {
    app.setIsWaiting(false);
    app.setCurrentView('game');
    app.updateView();
    client.resizeUI();
  });
  
  client.subscribe(comm.Message.EVENT_MATCH_OVER, function (msg, params) {
    app.setIsWaiting(false);
    app.setCurrentView('index');
    app.updateView();
  });

  $('#btn-create-match').click(function (e) {
    client.reqCreateMatch('RuleBgCasual');
  });

  $('#btn-join-match').click(function (e) {
    client.reqJoinMatch(null);
  });
  
  $('#btn-play-random').click(function (e) {
    app.setIsWaiting(true);
    app.updateView();
    client.reqPlayRandom('RuleBgCasual');
  });
  
  $(window).resize(function () {
    client.resizeUI();
  });

});