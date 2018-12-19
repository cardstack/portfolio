'use strict';

module.exports = {
  extends: 'recommended',
  rules: {
    "attribute-indentation": false,
    "block-indentation": false,
    quotes: false,
    "no-inline-styles": false,
    "no-invalid-interactive": false,
    "img-alt-attributes": false,
    "no-unnecessary-concat": true,
    "self-closing-void-elements": false,
    "link-rel-noopener": false
  },
  ignore: [
    "lib/cardstack-blueprints/blueprints/card/files/__dirname__/cards/__name__/addon/templates/*"
  ]
};
