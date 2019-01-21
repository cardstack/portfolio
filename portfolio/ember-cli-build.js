'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

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
    emberHighCharts: {
      includeHighCharts: false,
      includeHighStock: true
    }
  });


  return app.toTree();
};
