# backgammon.js [![Build Status](https://travis-ci.org/quasoft/backgammonjs.svg?branch=master)](https://travis-ci.org/quasoft/backgammonjs)

### Extensible multiplayer backgammon game written in JavaScript

NEW: Alpha version 0.2 released ([DEMO](https://backgammonjs.herokuapp.com/)).

*Note: The game is playable, but is still being developed. The [demo](https://backgammonjs.herokuapp.com/) is missing some features like resigning from game, undoing a move, or challenging a friend.*

## Features:

- Challenge friends or play with strangers online without registration and game setup process.
- Fair gameplay that is as close to real game as possible:
    - no visual hints (eg. for allowed moves);
    - no pip counter;
    - quality random generator.
- Extensible and modular engine that would allow the open source community to implement different variants of the game as known in different countries and different user interfaces (eg. themes).
- Lightweight - playable on any device, even old ones - anything that can run a modern browser;
- Works in browser @ PC & Mobile;

If you want to lean more about the project see [Detailed documentation](docs/README.md).

## Demo
[![Landing page](docs/images/progress-landing-page.jpg)](https://backgammonjs.herokuapp.com/)

[Playable DEMO of backgammon.js](https://backgammonjs.herokuapp.com/) - *the game is still alpha version, so it lacks some features like resigning, undoing a move, or challenging a friend.*

The demo is using the [free tier of Heroku](https://www.heroku.com/).

You are free to host the game at your own server.

## How to install

To host the game on your own server or test it locally for development, you need to install the main backgammon.js package.
It includes both the backgammon.js server and client.

There is no need to install the client separately, as it is served automatically from the server via HTTP.
Client should work in *modern* browsers of both desktop PCs and mobile devices.

The universal way to install the server is:

1. Clone repository locally
2. Change working directory to the local copy of the repository
3. Run:

        npm install
        npm start

The game server has been tested to work on the following platforms:

- [Ubuntu](docs/INSTALL.md#ubuntu)
- [Windows](docs/INSTALL.md#windows)
- [Docker](docs/INSTALL.md#docker)
- [Heroku](docs/INSTALL.md#heroku)
- [OpenShift Online](docs/INSTALL.md#openshift-online)

Follow the links above for more detailed installation instructions on those platforms.

## How to change default rule

By default the game server runs with the classical backgammon rule (popular worldwide).

To make the server run another rule, edit file [`app/browser/config.js`](app/browser/js/config.js), by changing `RuleBgCasual` with the name of the rule that you want:

    config.defaultRule = 'RuleBgCasual';

Currently two rules have been implemented, both popular in Bulgaria:
 
- [`RuleBgCasual`](lib/rules/RuleBgCasual.js) - Standard rules, but without doubling cube (Rules: [Standard/Обикновена](https://en.wikipedia.org/wiki/Backgammon#Rules))
- [`RuleBgGulbara`](lib/rules/RuleBgGulbara.js) - `Gul bara`, also called `Rosespring` or `Crazy Narde` (Rules: [Gul bara/Гюлбара](https://en.wikipedia.org/wiki/Gul_bara))

In next release, the game client will allow the player to choose the rule himself/herself.

## How to add new rules (variants)

Instructions on adding new rules to the game are coming soon: [Creating rules for `backgammon.js`](docs/rules.md).

Meanwhile, you can look how built-in rules have been implemented in the following directory:

- [`lib/rules/`](lib/rules/)

Filename of rules should start with prefix `Rule`, followed by `ISO 3166-1 alpha-2` country code (the country where this variant of the game is popular  - eg. `Bg` for `Bulgaria`) and the name of the rule. Don't use spaces or punctuation/special characters in the filename.

## Documentation:

- [Installation instructions](docs/INSTALL.md)
- [Detailed documentation](docs/README.md)

## Screenshots
![Prototype](docs/images/progress-gameplay.jpg)