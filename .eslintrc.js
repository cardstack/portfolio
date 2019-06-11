const browserBase = require('@cardstack/eslint-config/browser');
const nodeBase = require('@cardstack/eslint-config/-node');

module.exports = Object.assign({}, browserBase, {
  overrides: [Object.assign({}, nodeBase, {

    files: [
      'card-test-runner.js',
      'node-test-runner.js',
      'cards/*/schema.js',
      'cards/*/samples.js',
      'cards/*/cardstack/**/*.js',
      'portfolio/*/cardstack/**/*.js',
      'deploy/build.js',
      'deploy/card-test-linter.js',
      'shared-data/*.js'
    ]
  })]
});
