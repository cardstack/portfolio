const glob = require('glob');
const requireUncached = require('require-uncached');
const prepare = require('@cardstack/test-support/prepare-node-tests');

module.exports = function() {
  let patterns = [
    'packages/*/node-tests/**/*-test.js',
    'cards/*/node-tests/**/*-test.js',
  ];

  for (let pattern of patterns) {
    for (let file of glob.sync(pattern)) {
      prepare();
      requireUncached(process.cwd() + '/' + file);
    }
  }

};
