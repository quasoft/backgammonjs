# backgammon.js-model

The `backgammon.js-model` library, used by both `backgammon.js-client` and `backgammon.js-server` packages, provides the following functionality:

- Object oriented model of classes modeling real-world and objects and abstract notions ([model.js](model.js) file);
- Message IDs shared by client and server communication objects ([comm.js](comm.js) file);
- Base `Rule` class describing a variant of the game ([rules/rule.js](rules/rule.js) file);
- Sample rules for two variants of the game: [rules/RuleBgCasual.js](rules/RuleBgCasual.js) and [rules/RuleBgGulbara.js](rules/RuleBgGulbara.js).

## The whole picture

To get an idea how the library package fits in the whole picture, look at 
[project documentation](docs/design.md) containing details on design and architecture.

## Library reference 

Check out [library reference](../docs/lib/index.html) for more details on available classes.

To recompile library reference, using [jsdoc](http://usejsdoc.org/), execute the following:

```
cd lib
npm build:docs
```

