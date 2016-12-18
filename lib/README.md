# backgammon.js-lib

The `backgammon.js-lib` library, used by both `backgammon.js-client` and `backgammon.js-server`, provides the following functionality:

- Object oriented model of classes modeling real-world and objects and abstract notions ([model.js](model.js) file);
- Message IDs shared by client and server communication objects ([comm.js](comm.js) file);
- Base `Rule` class describing a variant of the game ([rules/rule.js](rules/rule.js) file);
- Sample rules for three variants of the game: [rules/RuleBgCasual.js](rules/RuleBgCasual.js), [rules/RuleBgGulbara.js](rules/RuleBgGulbara.js) and [rules/RuleBgTapa.js](rules/RuleBgTapa.js).

## The whole picture

To get an idea how the library package fits in the whole picture, look at
[project README](../README.md) and [detailed documentation](../docs/README.md).

## Library reference

Check out [library reference](https://cdn.rawgit.com/quasoft/backgammonjs/master/docs/backgammon.js-lib/0.0.1/index.html) and [class diagrams in documentation](../docs/README.md#model-classes) for more details on available classes.

To recompile library reference, using [jsdoc](http://usejsdoc.org/), execute the following:

```
cd lib
npm run build:docs
```

## Other documents:

- [`Project README`](../README.md)
- [`Detailed documentation`](../docs/README.md)
