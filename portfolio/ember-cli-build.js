'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { WatchedDir } = require('broccoli-source');
const { readdirSync, existsSync } = require('fs');
const { join, basename } = require('path');
const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    prember: {
      // we're not pre-rendering any URLs yet, but we still need prember because
      // our deployment infrastructure already expects `_empty.html` to exist
      // for handling unknown URLs.
      urls: []
    },
    fingerprint: {
      exclude: [
        'assets/artwork/'
      ]
    },
    strictWarnings: {
      'ember-htmlbars.style-xss-warning': ['development', 'test']
    },
    'ember-fetch': {
      preferNative: true
    },
    trees: {
      tests: testsTree()
    },
    emberHighCharts: {
      includeHighCharts: false,
      includeHighStock: true
    }
  });


  return app.toTree();
};

function allAbsolutePaths(dir) {
  return readdirSync(dir).map(name => join(dir, name));
}

function testsTree() {
  let packageDirs = allAbsolutePaths(join(__dirname, '..', 'cards'))
    .concat(allAbsolutePaths(join(__dirname, '..', 'packages')));

  let packageTrees = packageDirs.map(dir => {
    let testsDir = join(dir, 'tests');
    if (existsSync(testsDir)) {
      return new Funnel(new WatchedDir(testsDir), {
        exclude: ['dummy', 'index.html'],
        destDir: basename(dir)
      });
    }
  }).filter(Boolean);

  return mergeTrees([...packageTrees, new WatchedDir('tests')]);
}