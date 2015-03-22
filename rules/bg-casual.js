var Backgammon = Backgammon || {};
(function(bg) {

  /**
   * Most popular variant played in Bulgaria called casual (обикновена).
   */
  bg.RuleBgCasual = function() {
    bg.Rule.call(this);

    this.Title = "General";
    this.Description = "Most popular variant of backgammon played in Bulgaria.";
    this.Country = "Bulgaria";

    this.MaxPoints = 26;
    this.MaxPieces = 15;
  };

  /**
   * Roll dice and generate list of moves the player has to make according to
   * current rules.
   */
  bg.RuleBgCasual.prototype.rollDice = function() {
    // Create dice object with 2 random values
    var dice = bg.Dice.roll();

    // Add those values to moves list - the individual moves the player has to make
    dice.moves.push(dice.values);

    // Dices with equal values are played four times, so add two more moves
    if (dice.moves[0] == dice.moves[1]) {
      dice.moves.push(dice.values);
    }

    // Sort moves in descending order for convenience later in enforcing
    // move rules
    dice.moves.sort(function(a, b){return b-a});

    return dice;
  };
  
  bg.RuleBgCasual.prototype = Object.create(bg.Rule.prototype);
  bg.RuleBgCasual.prototype.constructor = bg.RuleBgCasual;

  return bg;
}(Backgammon))
