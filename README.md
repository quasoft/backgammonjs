# backgammon.js [![Build Status](https://travis-ci.org/quasoft/backgammonjs.svg?branch=master)](https://travis-ci.org/quasoft/backgammonjs)

### Extensible multiplayer backgammon game written in JavaScript

Current version: 0.5

See [CHANGELOG](CHANGELOG.md) for recent changes.

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

[Playable DEMO of backgammon.js](https://backgammonjs.herokuapp.com/)

The demo is using the [free tier of Heroku](https://www.heroku.com/).

You are free to host the game at your own server.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/quasoft/backgammonjs/tree/heroku)

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

Currently three rules have been implemented (as known in Bulgaria):
 
- [`RuleBgCasual`](lib/rules/RuleBgCasual.js) - Standard rules, but without doubling cube (Rules: [Standard/Обикновена](https://en.wikipedia.org/wiki/Backgammon#Rules))
- [`RuleBgGulbara`](lib/rules/RuleBgGulbara.js) - `Gul bara`, also called `Rosespring` or `Crazy Narde` (Rules: [Gul bara/Гюлбара](https://en.wikipedia.org/wiki/Gul_bara))
- [`RuleBgTapa`](lib/rules/RuleBgTapa.js) - `Tapa` (Rules: [Tapa/Тапа](https://en.wikipedia.org/wiki/Tapa_(game)))

The player can choose which rule to play before starting a new game.

## How to add new rules (variants)

Instructions on adding new rules to the game are coming soon: [Creating rules for `backgammon.js`](docs/rules.md).

Meanwhile, you can look how built-in rules have been implemented in the following directory:

- [`lib/rules/`](lib/rules/)

Filename of rules should start with prefix `Rule`, followed by `ISO 3166-1 alpha-2` country code (the country where this variant of the game is popular  - eg. `Bg` for `Bulgaria`) and the name of the rule. Don't use spaces or punctuation/special characters in the filename.

## Documentation:

- [Installation instructions](docs/INSTALL.md)
- [Detailed documentation](docs/README.md)

## Screenshots
### Classic rule:
![Classic rule](docs/images/progress-gameplay.jpg)
### Gul bara rule:
![Gul-bara rule](docs/images/progress-gameplay-2.jpg)
