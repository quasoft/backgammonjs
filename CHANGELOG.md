# Change Log
Change log introduced in version 0.4.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]
### Added
- None

### Changed
- None

## [0.6] - 2016-01-15
### Added
- Allow player to resign from game/match;

## [0.5] - 2016-12-17
### Added
- Implement challenge friends functionality - player can send a link for starting a private game with a friend;

## [0.4] - 2015-12-17
### Added
- New rule: Tapa (RuleBgTapa.js);
- Rule selector on front page - player can choose rule before starting a game;
- Show error message to player, if a move request is not valid;
- Show current match standings in an alert box during match (when a new game starts);
- Display alert box, if player undoes a move;
- Add OhSnap.js dependency;
- Allow player to undo moves;

### Changed
- Server to use separate waiting queues for each rule (via QueueManager);
- Fixed bug in Gulbara rule preventing player from bearing pieces;
- Changed rule RuleBgCasual to allow playing doubles as four moves, even on first turn. It's more common to play it that way in Bulgaria, instead of playing doubles after the first turn;
- Fixed bug that caused a piece to move several times, if double-clicked;


[0.6]: https://github.com/quasoft/backgammonjs/tree/0.6
[0.5]: https://github.com/quasoft/backgammonjs/tree/0.5
[0.4]: https://github.com/quasoft/backgammonjs/tree/0.4