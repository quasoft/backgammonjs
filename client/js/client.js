var Backgammon = Backgammon || {};
(function(Backgammon) {

  /**
   * Backgammon client
   * @constructor
   */
  Backgammon.Client = function () {

    /**
     * Client configuration
     */
    this.config = {
      'containerID': 'backgammon',
      'boardID': 'board',
      'rule': 'RuleBgCasual',
      'gui': 'SimpleGUI'
    };

    /**
     * Initialize client
     */
    this.init = function () {
      this.state = new Backgammon.Board();
      this.rule = new Backgammon[this.config.rule]();
      this.rule.initialize(this.state);
      this.rule.resetBoard(this.state);
      this.gui = new Backgammon[this.config.gui](this);
      this.gui.init();
    };

    /**
     * Create game
     */
    this.createGame = function () {
      var game = new Backgammon.Game();
      game.addHostPlayer(this);
      return game;
    };

    /**
     * Join game
     * @param {Backgammon.Game} Game to join
     */
    this.joinGame = function (game) {
      game.addGuestPlayer(this);
    };

    /**
     * Request move
     * @param {Backgammon.PieceType} piece type
     */
    this.requestMove = function (type) {
      ;
    };

  };

  return Backgammon;
})(Backgammon);
