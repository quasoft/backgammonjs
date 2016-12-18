'use strict';

var model = require('../../lib/model.js');


/**
 * There are two types of queues: random queues and challenge queues.
 * @readonly
 * @enum {number}
 */
var QueueType = {
  /** Queue for playing with random players */
  RANDOM : 0,
  /** Queue for playing with a friend */
  CHALLENGE : 1
};


/**
 * Represents a queue with players waiting to play for a game with
 * random player (random queue) or a friend (challenge queue).
 *
 * @constructor
 * @param {string} id - Unique id of this queue
 * @param {QueueType} type - Type of queue - RANDOM or CHALLENGE
 * @param {ruleName} ruleName - Name of rule. Value can be a regex pattern.
 */
function Queue(id, type, ruleName) {
  /**
   * For random queues the id matches the name of the rule (eg. RuleBgCasual).
   * The id of challenge queues is a unique id, that should be known only by
   * two players.
   * @type {string}
   */
  this.id = id;
  
  /**
   * Type of queue - RANDOM or CHALLENGE.
   * @type {QueueType}
   */
  this.type = type;
  
  /**
   * Name of rule for this queue. Value can be a regex pattern.
   * @type {string}
   */
  this.ruleName = ruleName;
  
  /**
   * List of players waiting in this queue
   * @type {Player[]}
   */
  this.players = [];
}

/**
 * Add player object to queue
 * 
 * @memberOf Queue
 * @param {Player} player - Player object
 */
Queue.prototype.addPlayer = function (player) {
  this.players.push(player);
};

/**
 * Pop player object from queue
 * 
 * @memberOf Queue
 * @returns {Player} - Player object
 */
Queue.prototype.popPlayer = function () {
  return this.players.pop();
};

/**
 * Remove player object from queue
 * 
 * @memberOf Queue
 * @param {Player} player - Player object
 */
Queue.prototype.removePlayer = function (player) {
  model.Utils.removeItem(this.players, player);
};

Queue.prototype.matchRuleName = function (ruleName) {
  var thisRegex = new RegExp(this.ruleName, "i");
  var otherRegex = new RegExp(ruleName, "i");
  
  return (this.ruleName === ruleName) ||
    (this.ruleName.match(otherRegex)) ||
    (ruleName.match(thisRegex));
};


/**
 * QueueManager is a singleton keeps track of multiple queues with waiting players
 * (one for each game rule and one for each challenge) and performs the addition/removal
 * of players to/from those queues.
 *
 * Queues are created on demand, when a player should be added to one.
 *
 * @constructor
 */
function QueueManager() {
  /**
   * Map of queues by id
   * @type {{Object.<string, Queue>}}
   */
  this._queueMap = {};
  
  /**
   * Creates a new queue with specified id and rule name
   * @param {string} id - Unique id of queue
   * @param {QueueType} type - Type of queue - RANDOM or CHALLENGE
   * @param {ruleName} ruleName - Name of rule. Value can be a regex pattern.
   * @returns {Queue} - Created queue object
   */
  this.createQueue = function (id, type, ruleName) {
    var queue = new Queue(id, type, ruleName);
    this._queueMap[id] = queue;
    return queue;
  };
  
  /**
   * Get queue object by its id
   * @param {string} id - Unique id of this queue
   * @returns {Queue} - Queue object
   */
  this.getQueue = function (id) {
    return this._queueMap[id];
  };
  
  /**
   * Add player to a random queue, storing the name of the rule the player wants to play.
   * If no queue is found that matches given id, a new one is created.
   * @param {Player} player - Player object to add
   * @param {ruleName} ruleName - Name of rule. Value can be a regex pattern.
   * @returns {Queue} - The queue object to which player was added.
   */
  this.addToRandom = function (player, ruleName) {
    // Note: ID of random queues equals ruleName
    var queue = this.getQueue(ruleName);
    if (!queue) {
      queue = this.createQueue(ruleName, QueueType.RANDOM, ruleName);
    }
    queue.addPlayer(player);
    return queue;
  };
  
  /**
   * Add player to a challenge queue, storing the name of the rule the player wants to play.
   * If no queue is found that matches given id, a new one is created.
   * @param {Player} player - Player object to add
   * @param {ruleName} ruleName - Name of rule. Value can be a regex pattern.
   * @param {string} queueID - Unique id of queue   
   * @returns {Queue} - The queue object to which player was added.
   */
  this.addToChallenge = function (player, ruleName, queueID) {
    // Note: ID of challenge queues is some unique number
    var queue = this.getQueue(queueID);
    if (!queue) {
      queue = this.createQueue(queueID, QueueType.CHALLENGE, ruleName);
    }
    queue.addPlayer(player);
    return queue;
  };
  
  /**
   * Pop a player from random queue for given rule
   * @param {ruleName} ruleName - Name of rule. Value can be a regex pattern to pop from any random queue.
   * @returns {{player: Player, ruleName: string}}  - Result object containing player object and rule name
   */
  this.popFromRandom = function (ruleName) {
    var
      result = {'player': null, 'ruleName': ''},
      id,
      queue;
    
    // Get first player found in any of random queues that matches ruleName
    for (id in this._queueMap) {
      if (this._queueMap.hasOwnProperty(id)) {
        queue = this.getQueue(id);
        if ((queue.type === QueueType.RANDOM) && (queue.matchRuleName(ruleName))) {
          result.player = queue.popPlayer();
          if (result.player) {
            result.ruleName = queue.ruleName;
            break;
          }
        }
      }
    }
    
    return result;
  };
  
  /**
   * Pop a player from challenge queue
   * @param {string} queueID - ID of queue
   * @returns {{player: Player, ruleName: string}}  - Result object containing player object and rule name
   */
  this.popFromChallenge = function (queueID) {
    var
      result = {'player': null, 'ruleName': ''},
      queue;
    
    queue = this.getQueue(queueID);
    if (!queue) {
      return result;
    }
    
    result.player = queue.popPlayer();
    result.ruleName = queue.ruleName;
    
    return result;
  };
  
  /**
   * Remove player from a specified queue
   * @param {Player} player - Player object to remove
   * @param {string} queueID - Unique id of queue from which to remove player.
   */
  this.remove = function (player, queueID) {
    var queue = this.getQueue(queueID);
    if (queue) {
      queue.removePlayer(player);
    }
  };
  
  /**
   * Remove player from all queues
   * @param {Player} player - Player object to remove
   */
  this.removeFromAll = function (player) {
    var id;
    for (id in this._queueMap) {
      if (this._queueMap.hasOwnProperty(id)) {
        this.remove(player, id);
      }
    }
  };
}

module.exports = {
  'Queue': Queue,
  'QueueManager': QueueManager
};
